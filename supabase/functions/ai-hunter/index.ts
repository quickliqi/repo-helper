import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { auditScrapedDeals } from "./audit/orchestrator.ts";
import { AuditReport } from "./audit/types.ts";

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface PropertyAddress {
    line?: string;
    street?: string;
    city?: string;
    state?: string;
    state_code?: string;
    postal_code?: string;
    zip?: string;
}

interface MlsListing {
    list_price?: number;
    price?: number;
    property_id?: string;
    permalink?: string;
    href?: string;
    location?: { address?: PropertyAddress };
    address?: PropertyAddress;
    description?: {
        text?: string;
        sqft?: number;
        lot_sqft?: number;
        beds?: number;
        bedrooms?: number;
        baths?: number;
        bathrooms?: number;
        type?: string;
        year_built?: number;
    };
    sqft?: number;
    beds?: number;
    baths?: number;
    prop_type?: string;
    year_built?: number;
    list_date?: string;
    listing_date?: string;
}

interface Deal {
    title: string;
    price: number;
    asking_price: number;
    location: string;
    source: string;
    description: string;
    link: string;
    listing_url?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    bedrooms?: number;
    bathrooms?: number;
    sqft?: number;
    year_built?: number;
    property_type?: string;
    deal_type?: string;
    condition?: string;
    arv?: number;
    repair_estimate?: number;
    ai_score?: number;
    reasoning?: string;
    metrics?: DealMetrics | null;
    validated?: boolean;
    dom?: number;
}

interface ScrapeData {
    data?: {
        markdown?: string;
    };
    markdown?: string;
}

interface LovableAiResponse {
    choices?: Array<{
        message?: {
            content?: string;
        };
    }>;
}

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, sentry-trace, baggage",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const logStep = (step: string, details?: unknown) => {
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
    console.log(`[AI-HUNTER] ${step}${detailsStr}`);
};

// Admin email for bypass
const ADMIN_EMAIL = "thomasdamienak@gmail.com";

// ─── Shared Math Utility ──────────────────────────────────────────────
import { calculateMetrics, cleanNumber } from "../_shared/dealMath.ts";

// ─── Calculator Logic REMOVED (Frontend is Single Source of Truth) ───────────
// Math logic has been moved to src/lib/calculations.ts on the frontend.


// ─── Property Type Mapping ─────────────────────────────────────────
function mapPropertyType(apiType: string): string {
    const mapping: Record<string, string> = {
        'single_family': 'single_family',
        'multi_family': 'multi_family',
        'condo': 'condo',
        'condos': 'condo',
        'townhome': 'townhouse',
        'townhomes': 'townhouse',
        'townhouse': 'townhouse',
        'mobile': 'mobile_home',
        'land': 'land',
        'farm': 'land',
        'commercial': 'commercial',
        'duplex_triplex': 'multi_family',
        'apartment': 'multi_family',
    };
    return mapping[apiType?.toLowerCase()] || 'other';
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const supabaseAuth = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
    );

    try {
        logStep("Function started");

        // Authenticate user
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("No authorization header");

        const token = authHeader.replace("Bearer ", "");
        const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
        if (userError || !userData.user) throw new Error("User not authenticated");

        const userId = userData.user.id;
        const userEmail = userData.user.email;
        logStep("User authenticated", { userId, email: userEmail });

        // Admin bypass
        let isAdmin = userEmail === ADMIN_EMAIL;

        if (!isAdmin) {
            const { data: roleData } = await supabaseAdmin
                .from("user_roles")
                .select("role")
                .eq("user_id", userId)
                .eq("role", "admin")
                .maybeSingle();

            if (roleData) {
                isAdmin = true;
            } else {
                const { data: credits } = await supabaseAdmin
                    .from("scrape_credits")
                    .select("*")
                    .eq("user_id", userId)
                    .single();

                if (!credits || credits.credits_remaining <= 0) {
                    throw new Error("No AI Hunter credits remaining for this month.");
                }
            }
        }

        logStep("Access check passed", { isAdmin });

        const body = await req.json();
        const { city, state, admin_mode, min_price, max_price, property_type, max_days_on_market } = body;
        const adminMode = admin_mode === true && isAdmin;

        if (!city || !state) {
            throw new Error("City and state are required.");
        }

        logStep("Request received", { city, state, adminMode });

        // ─── Fetch scraper config for max_results ─────────────────
        let maxResults = 10;
        try {
            const { data: configRows } = await supabaseAdmin
                .from("scraper_config")
                .select("key, value")
                .in("key", ["max_results"]);
            if (configRows) {
                for (const row of configRows) {
                    if (row.key === "max_results") maxResults = Number(row.value);
                }
            }
        } catch {
            logStep("Config fetch failed, using defaults");
        }
        if (adminMode) maxResults = 50; // Admin override — no limit

        // ─── Fetch domain blacklist ────────────────────────────────
        let blacklistedDomains: string[] = [];
        try {
            const { data: domainRules } = await supabaseAdmin
                .from("scraper_domain_rules")
                .select("domain")
                .eq("rule_type", "blacklist");
            if (domainRules) {
                blacklistedDomains = domainRules.map((r: { domain: string }) => r.domain.toLowerCase());
            }
        } catch {
            logStep("Domain rules fetch failed, skipping");
        }

        // Get user's buy boxes for filtering context
        const { data: buyBoxes } = await supabaseAdmin
            .from("buy_boxes")
            .select("*")
            .eq("user_id", userId)
            .eq("is_active", true);

        // Derive price range: Explicit filters > Buy Boxes > Default
        let minPrice = 0;
        let maxPrice = 5000000;

        if (min_price !== undefined || max_price !== undefined) {
            if (min_price !== undefined) minPrice = Number(min_price);
            if (max_price !== undefined) maxPrice = Number(max_price);
        } else if (buyBoxes && buyBoxes.length > 0) {
            const mins = buyBoxes.filter(b => b.min_price).map(b => b.min_price);
            const maxs = buyBoxes.filter(b => b.max_price).map(b => b.max_price);
            if (mins.length > 0) minPrice = Math.min(...mins);
            if (maxs.length > 0) maxPrice = Math.max(...maxs);
        }

        // ═══════════════════════════════════════════════════════════
        // SOURCE 1: Real Estate API (MLS Listings)
        // ═══════════════════════════════════════════════════════════
        let mlsDeals: Deal[] = [];
        const rapidApiKey = Deno.env.get("RAPIDAPI_KEY");

        if (rapidApiKey) {
            try {
                logStep("Fetching MLS listings via RapidAPI");

                const params = new URLSearchParams({
                    city: city,
                    state_code: state,
                    limit: "10",
                    offset: "0",
                    sort: "newest",
                });
                if (minPrice > 0) params.append("price_min", minPrice.toString());
                if (maxPrice < 5000000) params.append("price_max", maxPrice.toString());
                if (property_type && property_type !== 'any') {
                    // Map to RapidAPI types if needed, or rely on post-filter
                    params.append("prop_type", property_type);
                }

                const mlsResponse = await fetch(
                    `https://us-real-estate.p.rapidapi.com/v3/for-sale?${params.toString()}`,
                    {
                        method: "GET",
                        headers: {
                            "x-rapidapi-key": rapidApiKey,
                            "x-rapidapi-host": "us-real-estate.p.rapidapi.com",
                        },
                    }
                );

                if (mlsResponse.ok) {
                    const mlsData = await mlsResponse.json();
                    const listings: MlsListing[] = mlsData?.data?.home_search?.results || mlsData?.data?.results || [];
                    logStep("MLS listings received", { count: listings.length });

                    mlsDeals = listings
                        .filter((listing) => {
                            const price = listing.list_price || listing.price;
                            return price !== undefined && price >= minPrice && price <= maxPrice;
                        })
                        .slice(0, maxResults)
                        .map((listing) => {
                            const price = listing.list_price || listing.price || 0;
                            const address = listing.location?.address || listing.address || {};
                            const description = listing.description || {};
                            const sqft = description.sqft || listing.sqft || description.lot_sqft;
                            const beds = description.beds || listing.beds || description.bedrooms;
                            const baths = description.baths || listing.baths || description.bathrooms;
                            const propType = description.type || listing.prop_type || 'single_family';
                            const listDate = listing.list_date || listing.listing_date; // Check API response for actual field

                            // Calculate DOM if possible (simplified placeholder)
                            const dom = listDate ? Math.floor((Date.now() - new Date(listDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;

                            // Deterministic URL Extraction with Strict Regex
                            // Requirement: Find specific /realestateandhomes-detail/ URL, reject /realestateandhomes-search/
                            let listingUrl = "";
                            const detailRegex = /\/realestateandhomes-detail\//;
                            const searchRegex = /\/realestateandhomes-search\//;

                            // Helper to validate and normalize URL/path
                            const normalizeUrl = (val: string): string | null => {
                                if (searchRegex.test(val)) return null; // Reject search pages
                                if (detailRegex.test(val)) {
                                    if (val.startsWith('http')) return val;
                                    const cleanPath = val.startsWith('/') ? val : `/${val}`;
                                    return `https://www.realtor.com\${cleanPath}`;
                                }
                                return null;
                            };

                            // 1. Priority: Check known fields
                            if (listing.href) listingUrl = normalizeUrl(listing.href) || "";
                            if (!listingUrl && listing.permalink) {
                                // If permalink contains the full path
                                listingUrl = normalizeUrl(listing.permalink) || "";

                                // If permalink is just a slug (no paths, seems like a valid ID string)
                                if (!listingUrl && !listing.permalink.includes('/') && listing.permalink.length > 5) {
                                    listingUrl = `https://www.realtor.com/realestateandhomes-detail/\${listing.permalink}`;
                                }
                            }

                            const streetAddr = address.line || address.street || "Address Available on Source";
                            const cityName = address.city || city;
                            const stateCode = address.state_code || address.state || state;
                            const zipCode = address.postal_code || address.zip || "";

                            // 2. Search deeper in the object if not found
                            if (!listingUrl) {
                                const searchValues = (obj: any, depth = 0) => {
                                    if (depth > 2 || !obj) return;
                                    for (const key in obj) {
                                        const val = obj[key];
                                        if (typeof val === 'string') {
                                            const normalized = normalizeUrl(val);
                                            if (normalized) {
                                                listingUrl = normalized;
                                                return;
                                            }
                                        } else if (typeof val === 'object' && val !== null) {
                                            searchValues(val, depth + 1);
                                            if (listingUrl) return;
                                        }
                                    }
                                };
                                searchValues(listing);
                            }

                            // 3. Google Search Fallback (Link Fallback)
                            if (!listingUrl) {
                                const query = `${streetAddr} ${cityName} ${stateCode} real estate`;
                                listingUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                            }

                            return {
                                title: `${beds || '?'}BR/${baths || '?'}BA - ${streetAddr}`,
                                price: price,
                                asking_price: price,
                                location: `${cityName}, ${stateCode}`,
                                source: "Aggregated MLS",
                                description: `${beds || '?'} bed ${baths || '?'} bath, ${sqft ? sqft.toLocaleString() + ' sqft' : 'sqft N/A'}. ${description.text || ''}`.trim().substring(0, 300),
                                link: listingUrl,
                                listing_url: listingUrl,
                                address: streetAddr,
                                city: cityName,
                                state: stateCode,
                                zip_code: zipCode,
                                bedrooms: beds ? Number(beds) : undefined,
                                bathrooms: baths ? Number(baths) : undefined,
                                sqft: sqft ? Number(sqft) : undefined,
                                year_built: description.year_built || listing.year_built || undefined,
                                property_type: mapPropertyType(propType),
                                deal_type: "wholesale",
                                condition: "fair",
                                dom: dom
                            };
                        });

                    logStep("MLS deals processed", { count: mlsDeals.length });
                } else {
                    const errorText = await mlsResponse.text();
                    logStep("MLS API error", { status: mlsResponse.status, error: errorText.substring(0, 200) });
                }
            } catch (mlsError: unknown) {
                const message = mlsError instanceof Error ? mlsError.message : String(mlsError);
                logStep("MLS fetch failed", { error: message });
            }
        } else {
            logStep("No RAPIDAPI_KEY configured, skipping MLS source");
        }

        // ═══════════════════════════════════════════════════════════
        // SOURCE 2: Firecrawl FSBO Scraping
        // ═══════════════════════════════════════════════════════════
        let fsboDeals: Deal[] = [];
        const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
        const lovableKey = Deno.env.get("LOVABLE_API_KEY");

        if (firecrawlKey) {
            try {
                logStep("Scraping FSBO listings via Firecrawl");

                const citySlug = city.toLowerCase().replace(/\s+/g, '');
                // Craigslist FSBO search for the metro area
                const craigslistUrl = `https://\${citySlug}.craigslist.org/search/rea?purveyor=owner&min_price=\${minPrice}&max_price=\${maxPrice}`;

                const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer \${firecrawlKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        url: craigslistUrl,
                        formats: ["markdown"],
                        onlyMainContent: true,
                        waitFor: 3000,
                    }),
                });

                if (scrapeResponse.ok) {
                    const scrapeData: ScrapeData = await scrapeResponse.json();
                    const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
                    logStep("Firecrawl FSBO content received", { contentLength: markdown.length });

                    // Use AI to extract structured deals from raw content
                    if (markdown.length > 100 && lovableKey) {
                        const extractionPrompt = `You are a real estate data extraction AI. Extract property listings from this Craigslist FSBO page content.

SCRAPED CONTENT:
\${markdown.substring(0, 8000)}

TASK: Extract up to 5 property listings. For each, extract all available data.

Return ONLY valid JSON:
{
  "deals": [
    {
      "title": "Brief property description",
      "price": 165000,
      "address": "Street address if available",
      "city": "\${city}",
      "state": "\${state}",
      "bedrooms": 3,
      "bs": 2,
      "sqft": 1450,
      "description": "Full listing description",
      "link": "https://craigslist.org/actual/post/url",
      "listing_url": "https://craigslist.org/actual/post/url",
      "condition": "fair"
    }
  ]
}

Rules:
- price MUST be a number, not a string
- Only include listings with a clear asking price
- If data is unavailable, omit the field
- link should be the actual posting URL if found in content
- listing_url should be the specific href from the anchor tag surrounding the property title or image. If it's relative (starts with /), keep it that way, we will fix it.`;

                        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                            method: "POST",
                            headers: {
                                "Authorization": `Bearer \${lovableKey}`,
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                model: "google/gemini-2.5-flash",
                                messages: [
                                    { role: "system", content: "You are a precise real estate data extraction AI. Respond with valid JSON only. No markdown, no code fences." },
                                    { role: "user", content: extractionPrompt }
                                ],
                            }),
                        });

                        if (aiResponse.ok) {
                            const aiData: LovableAiResponse = await aiResponse.json();
                            const aiContent = aiData.choices?.[0]?.message?.content || "{}";

                            try {
                                const cleaned = aiContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
                                const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
                                if (jsonMatch) {
                                    const parsed = JSON.parse(jsonMatch[0]);
                                    fsboDeals = (parsed.deals || []).map((d: Partial<Deal>) => {
                                        // Fix relative URLs
                                        let lUrl = d.listing_url || d.link || craigslistUrl;
                                        if (lUrl.startsWith('/')) {
                                            const baseUrl = new URL(craigslistUrl).origin;
                                            lUrl = baseUrl + lUrl;
                                        }

                                        return {
                                            ...d,
                                            title: d.title || "FSBO Deal",
                                            price: typeof d.price === 'number' ? d.price : 0,
                                            asking_price: typeof d.price === 'string' ? parseInt((d.price as string).replace(/[$,]/g, '')) : (d.price || 0),
                                            location: `\${d.city || city}, \${d.state || state}`,
                                            city: d.city || city,
                                            state: d.state || state,
                                            property_type: d.property_type || 'single_family',
                                            deal_type: "wholesale",
                                            link: lUrl,
                                            listing_url: lUrl,
                                            source: "Craigslist FSBO",
                                            description: d.description || "",
                                            address: d.address || "",
                                            zip_code: d.zip_code,
                                            bedrooms: d.bedrooms,
                                            bathrooms: d.bathrooms,
                                            sqft: d.sqft,
                                            condition: d.condition,
                                        };
                                    });
                                    logStep("FSBO deals extracted", { count: fsboDeals.length });
                                }
                            } catch (parseErr: unknown) {
                                const message = parseErr instanceof Error ? parseErr.message : String(parseErr);
                                logStep("FSBO JSON parse error", { error: message });
                            }
                        }
                    }
                } else {
                    logStep("Firecrawl error", { status: scrapeResponse.status });
                }
            } catch (fsboError: unknown) {
                const message = fsboError instanceof Error ? fsboError.message : String(fsboError);
                logStep("FSBO scrape failed", { error: message });
            }
        } else {
            logStep("No FIRECRAWL_API_KEY configured, skipping FSBO source");
        }

        // ═══════════════════════════════════════════════════════════
        // MERGE & VALIDATE through Calculator Agent
        // ═══════════════════════════════════════════════════════════
        let allDeals = [...mlsDeals, ...fsboDeals];
        logStep("Total raw deals", { mls: mlsDeals.length, fsbo: fsboDeals.length, total: allDeals.length });

        // If no real data sources returned results, use AI-generated market analysis as fallback
        if (allDeals.length === 0 && lovableKey) {
            logStep("No real data sources available, using AI market analysis fallback");

            const fallbackPrompt = `You are a real estate investment AI analyzing the \${city}, \${state} market.

Investor Buy Box: \${JSON.stringify(buyBoxes || [])}

Generate 3-5 realistic property listings that would currently exist in \${city}, \${state}.
Base them on real market conditions. Include realistic addresses (use real street names).

Return ONLY valid JSON:
{
  "deals": [
    {
      "title": "Property description",
      "price": 165000,
      "address": "123 Real Street Name",
      "city": "\${city}",
      "state": "\${state}",
      "zip_code": "30301",
      "bedrooms": 3,
      "bathrooms": 2,
      "sqft": 1450,
      "arv": 255000,
      "repair_estimate": 25000,
      "description": "Brief property description",
      "link": "https://www.realtor.com/realestateandhomes-search/\${city}_\${state}",
      "source": "MLS",
      "condition": "fair",
      "property_type": "single_family"
    }
  ]
}`;

            try {
                const fallbackResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer \${lovableKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: "google/gemini-2.5-flash",
                        messages: [
                            { role: "system", content: "You are a real estate data AI. Respond with valid JSON only." },
                            { role: "user", content: fallbackPrompt }
                        ],
                    }),
                });

                if (fallbackResponse.ok) {
                    const fbData: LovableAiResponse = await fallbackResponse.json();
                    const fbContent = fbData.choices?.[0]?.message?.content || "{}";
                    const cleaned = fbContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
                    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        allDeals = (parsed.deals || []).map((d: Partial<Deal>) => ({
                            ...d,
                            title: d.title || "Market Analysis Deal",
                            price: d.price || 0,
                            asking_price: d.price || 0,
                            location: `\${d.city || city}, \${d.state || state}`,
                            deal_type: d.deal_type || "wholesale",
                            source: "AI Market Analysis",
                            description: d.description || "",
                            link: d.link || "",
                            address: d.address,
                            city: d.city,
                            state: d.state,
                            zip_code: d.zip_code,
                            bedrooms: d.bedrooms,
                            bathrooms: d.bathrooms,
                            sqft: d.sqft,
                            condition: d.condition,
                            property_type: d.property_type
                        }));
                        logStep("AI fallback deals generated", { count: allDeals.length });
                    }
                }
            } catch (fbErr: unknown) {
                const message = fbErr instanceof Error ? fbErr.message : String(fbErr);
                logStep("AI fallback failed", { error: message });
            }
        }

        // ─── Filter blacklisted domains ─────────────────────────
        if (blacklistedDomains.length > 0) {
            const beforeCount = allDeals.length;
            allDeals = allDeals.filter(deal => {
                const link = (deal.link || "").toLowerCase();
                const source = (deal.source || "").toLowerCase();
                return !blacklistedDomains.some(d => link.includes(d) || source.includes(d));
            });
            const filtered = beforeCount - allDeals.length;
            if (filtered > 0) logStep("Blacklisted deals filtered", { filtered });
        }

        // ─── Dedup against existing hashes in DB ──────────────────
        const dedupHashes = allDeals.map(deal => {
            const addr = (deal.address || deal.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
            const c = (deal.city || "").toLowerCase().replace(/[^a-z0-9]/g, "");
            const s = (deal.state || "").toLowerCase().replace(/[^a-z]/g, "");
            return `\${addr}|\${c}|\${s}`;
        });

        try {
            const { data: existingHashes } = await supabaseAdmin
                .from("scraper_dedup_hashes")
                .select("address_hash")
                .in("address_hash", dedupHashes);

            if (existingHashes && existingHashes.length > 0) {
                const existingSet = new Set(existingHashes.map((h: { address_hash: string }) => h.address_hash));
                const beforeCount = allDeals.length;
                allDeals = allDeals.filter((_, i) => !existingSet.has(dedupHashes[i]));
                const deduped = beforeCount - allDeals.length;
                if (deduped > 0) logStep("Cross-session duplicates removed", { deduped });
            }
        } catch {
            logStep("Dedup check failed, skipping");
        }

        // Run Shared Math Utility on all deals
        const validatedDeals = allDeals.map((deal) => {
            const price = cleanNumber(deal.asking_price || deal.price);
            const arv = cleanNumber(deal.arv);
            const repairs = cleanNumber(deal.repair_estimate);
            const metrics = calculateMetrics(arv, price, repairs, 0, deal.condition);

            return {
                title: deal.title,
                price: price,
                location: deal.location,
                source: deal.source || "Aggregated MLS",
                description: deal.description || "",
                link: deal.listing_url || deal.link || "",
                listing_url: deal.listing_url || deal.link || "",
                ai_score: metrics.score,
                reasoning: "Metrics calculated via shared utility.",
                metrics: metrics,
                validated: true, // Mark as validated since we ran the math
                // Preserve structured fields for audit pipeline
                address: deal.address,
                city: deal.city,
                state: deal.state,
                zip_code: deal.zip_code,
                bedrooms: deal.bedrooms,
                bathrooms: deal.bathrooms,
                sqft: deal.sqft,
                property_type: deal.property_type,
                condition: deal.condition,
                asking_price: price,
                dom: deal.dom,
            };
        });

        // ─── STRICT FILTER ENFORCEMENT ────────────────────────────────
        // External APIs are often loose with filters, so we strictly enforce them here.

        let finalResults = validatedDeals.filter(deal => {
            const price = deal.asking_price || deal.price || 0;

            // 1. Price Filter
            if (minPrice > 0 && price < minPrice) return false;
            if (maxPrice < 5000000 && price > maxPrice) return false;

            // 2. Property Type Filter
            if (property_type && property_type !== 'any') {
                const pType = (deal.property_type || '').toLowerCase();
                const target = property_type.toLowerCase();

                if (target === 'multi_family') {
                    // Match variations of multi-family
                    if (!['multi_family', 'duplex', 'triplex', 'quadruplex', 'apartment'].includes(pType)) {
                        return false;
                    }
                } else {
                    // Exact match for other types
                    if (pType !== target) return false;
                }
            }

            // 3. Days on Market Filter
            if (max_days_on_market) {
                const maxDom = Number(max_days_on_market);
                // Only filter if DOM is actually present. If unknown (0 or undefined), we let it pass 
                // to avoid hiding fresh but un-flagged listings, unless strict mode is desired.
                // Here we treat 0 as "unknown" or "brand new".
                if (deal.dom && deal.dom > maxDom) {
                    return false;
                }
            }

            return true;
        });

        // Sort by AI score descending
        finalResults.sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));

        logStep("Running audit pipeline...", { count: finalResults.length });

        // ─── Run Audit Pipeline (including Assessor Enrichment) ───
        let auditReport: AuditReport | null = null;
        try {
            // Generate a session ID if not provided (or use one if it exists in body)
            const sessionId = body.session_id || crypto.randomUUID();

            auditReport = await auditScrapedDeals(
                finalResults as any,
                buyBoxes as any,
                userId,
                sessionId,
                supabaseAdmin
            );

            logStep("Audit pipeline complete", {
                score: auditReport.overallScore,
                pass: auditReport.pass,
                enrichment: auditReport.assessor?.filter(a => a.hasAssessorData).length
            });
        } catch (auditErr) {
            logStep("Audit pipeline failed (non-critical)", { error: String(auditErr) });
        }

        logStep("Deals validated & sorted", { count: finalResults.length, validated: finalResults.filter((d) => d.validated).length });

        // Register dedup hashes for future cross-session detection
        try {
            const hashRows = validatedDeals.map((deal) => {
                const addr = (deal.address || deal.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                const c = (deal.city || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                const s = (deal.state || "").toLowerCase().replace(/[^a-z]/g, "");
                return {
                    address_hash: `\${addr}|\${c}|\${s}`,
                    price: deal.price,
                    source: deal.source,
                };
            });
            if (hashRows.length > 0) {
                await supabaseAdmin
                    .from("scraper_dedup_hashes")
                    .upsert(hashRows, { onConflict: "address_hash" });
            }
        } catch {
            logStep("Dedup hash registration failed (non-critical)");
        }

        // Deduct credit for non-admin users (skip in admin_mode)
        if (!isAdmin && !adminMode) {
            const { data: credits } = await supabaseAdmin
                .from("scrape_credits")
                .select("*")
                .eq("user_id", userId)
                .single();

            if (credits) {
                await supabaseAdmin
                    .from("scrape_credits")
                    .update({
                        credits_remaining: credits.credits_remaining - 1,
                        credits_used: (credits.credits_used || 0) + 1,
                        updated_at: new Date().toISOString()
                    })
                    .eq("user_id", userId);
            }
        }

        return new Response(JSON.stringify({
            deals: finalResults,
            auditReport, // NEW: Include the full audit & assessor report
            admin_mode: adminMode,
            sources: {
                mls: mlsDeals.length,
                fsbo: fsboDeals.length,
                fallback: allDeals.length === 0 ? 0 : (mlsDeals.length === 0 && fsboDeals.length === 0 ? validatedDeals.length : 0),
            },
            total: finalResults.length,
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        logStep("ERROR", { message });
        return new Response(JSON.stringify({
            error: message
        }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
