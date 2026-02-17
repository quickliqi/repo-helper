import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface BuyBox {
  id: string;
  name?: string;
  min_price?: number;
  max_price?: number;
  property_types?: string[];
  locations?: string[];
  min_bedrooms?: number;
  min_bathrooms?: number;
}

interface ScrapedDeal {
  address?: string;
  price?: number | string;
  description?: string;
  url?: string;
  image_url?: string;
  posted_date?: string;
  seller_name?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  property_type?: string;
  condition?: string;
  arv_estimate?: number;
  repair_estimate?: number;
  match_score?: number;
  confidence_score?: number;
  matched_buy_box_id?: string;
  analysis_notes?: string;
}

interface FirecrawlScrapeResponse {
  success: boolean;
  data?: {
    content?: string;
    markdown?: string;
    metadata?: {
      title?: string;
      description?: string;
      url?: string;
    };
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
  console.log(`[SCRAPE-FACEBOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error("User not authenticated");

    logStep("User authenticated", { userId: user.id });

    // Check for investor role (or admin)
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isInvestor = roles?.some(r => r.role === 'investor' || r.role === 'admin');
    if (!isInvestor) {
      throw new Error("Investor access required");
    }

    // Check rate limit (simpler version for now)
    // In production, use a dedicated rate limit table
    const { count } = await supabaseAdmin
      .from("scrape_sessions")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", user.id)
      .gte("created_at", new Date(Date.now() - 60000).toISOString()); // Last minute

    if (count && count > 5) {
      throw new Error("Rate limit exceeded (5 scrapes/minute)");
    }

    // Check credits
    const { data: credits } = await supabaseAdmin
      .from("scrape_credits")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!credits || credits.credits_remaining < 1) {
      throw new Error("Insufficient scrape credits");
    }

    const body = await req.json();
    const { url, buyBoxId } = body;

    if (!url) throw new Error("URL is required");

    // Fetch Buy Box Criteria if provided, or use all active
    let buyBoxes: BuyBox[] = [];
    if (buyBoxId) {
      const { data } = await supabaseAdmin
        .from("buy_boxes")
        .select("*")
        .eq("id", buyBoxId)
        .single();
      if (data) buyBoxes = [data];
    } else {
      const { data } = await supabaseAdmin
        .from("buy_boxes")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true);
      if (data) buyBoxes = data;
    }

    logStep("Target configuration", { url, buyBoxCount: buyBoxes.length });

    // 1. Scrape with Firecrawl
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) throw new Error("Firecrawl API key not configured");

    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    if (!scrapeResponse.ok) {
      logStep("Firecrawl error", { status: scrapeResponse.status });
      throw new Error(`Scraping failed: ${scrapeResponse.statusText}`);
    }

    const scrapeData: FirecrawlScrapeResponse = await scrapeResponse.json();
    const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";

    if (markdown.length < 100) {
      throw new Error("Scraped content too short or empty");
    }

    logStep("Scraping successful", { length: markdown.length });

    // 2. Analyze with Lovable AI (Gemini)
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("Lovable API key not configured");

    const analysisPrompt = `You are a real estate investment analyst. Analyze the following Facebook/Marketplace content and extract property listings.

Evaluate each listing against these Buy Box criteria:
${JSON.stringify(buyBoxes)}

CONTENT:
${markdown.substring(0, 15000)}

Respond with a JSON array of deals in this exact format:
{
  "deals": [
    {
      "address": "string",
      "price": number,
      "description": "string",
      "url": "original post url",
      "bedrooms": number,
      "bathrooms": number,
      "sqft": number,
      "property_type": "string",
      "condition": "poor|fair|good|excellent",
      "arv_estimate": number (estimate based on location/condition),
      "repair_estimate": number (estimate based on condition),
      "match_score": number (0-100 based on buy box),
      "confidence_score": number (0-100 based on data quality),
      "matched_buy_box_id": "uuid of best matching buy box or null",
      "analysis_notes": "string explaining match and confidence reasoning"
    }
  ]
}

Only return deals with match_score > 60.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a real estate analyst. Return valid JSON only. No markdown." },
          { role: "user", content: analysisPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error("AI analysis failed");
    }

    const aiData: LovableAiResponse = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "{}";
    const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    let deals: ScrapedDeal[] = [];
    try {
      const parsed = JSON.parse(cleaned);
      deals = parsed.deals || [];
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      logStep("JSON parse error", { error: message });
    }

    logStep("Analysis complete", { dealsFound: deals.length });

    // Filter high confidence deals
    const validDeals = deals.filter(d => (d.confidence_score || 0) >= 70);

    // 3. Save Results
    if (validDeals.length > 0) {
      // Create session
      const { data: session, error: sessError } = await supabaseAdmin
        .from("scrape_sessions")
        .insert({
          user_id: user.id,
          source_url: url,
          status: "completed",
          deals_found: validDeals.length
        })
        .select()
        .single();

      if (!sessError && session) {
        // Save deals
        const dealsToInsert = validDeals.map(d => ({
          session_id: session.id,
          user_id: user.id,
          address: d.address || "Unknown Address",
          price: typeof d.price === 'number' ? d.price : parseInt(String(d.price).replace(/[^0-9]/g, '')) || 0,
          description: d.description,
          url: d.url || url,
          meta_data: {
            bedrooms: d.bedrooms,
            bathrooms: d.bathrooms,
            sqft: d.sqft,
            condition: d.condition,
            analysis: d.analysis_notes
          },
          ai_score: d.match_score,
          buy_box_id: d.matched_buy_box_id
        }));

        await supabaseAdmin.from("scrape_results").insert(dealsToInsert);
      }
    }

    // Deduct credit
    await supabaseAdmin
      .from("scrape_credits")
      .update({
        credits_remaining: credits.credits_remaining - 1,
        credits_used: credits.credits_used + 1
      })
      .eq("user_id", user.id);

    return new Response(JSON.stringify({
      success: true,
      deals: validDeals,
      count: validDeals.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: message });
    return new Response(JSON.stringify({
      success: false,
      error: message
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, sentry-trace, baggage",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SCRAPE-DEALS] ${step}${detailsStr}`);
};

// Rate limit: 5 requests per minute per user
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MINUTES = 1;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) throw new Error("User not authenticated");

    const userId = userData.user.id;
    logStep("User authenticated", { userId });

    // Check rate limit
    const { data: rateLimitOk, error: rlError } = await supabaseAdmin.rpc("check_rate_limit", {
      p_user_id: userId,
      p_function_name: "scrape-facebook-deals",
      p_max_requests: RATE_LIMIT_MAX,
      p_window_minutes: RATE_LIMIT_WINDOW_MINUTES,
    });

    if (rlError) {
      logStep("Rate limit check error", { error: rlError.message });
    }

    if (rateLimitOk === false) {
      logStep("Rate limit exceeded", { userId });
      return new Response(JSON.stringify({
        success: false,
        error: "Rate limit exceeded. Please wait before making more requests.",
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is an investor
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (roleData?.role !== "investor") {
      throw new Error("Only investors can use the scraping feature");
    }

    // Check scrape credits
    const { data: credits } = await supabaseAdmin
      .from("scrape_credits")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!credits || credits.credits_remaining <= 0 || !credits.subscription_active) {
      throw new Error("No scrape credits available. Please subscribe to Investor Scraping Pro.");
    }

    logStep("Credits verified", { remaining: credits.credits_remaining });

    const { url } = await req.json();
    if (!url) throw new Error("URL is required");

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }
    logStep("Scraping URL", { url: formattedUrl });

    // Create scrape session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from("scrape_sessions")
      .insert({
        user_id: userId,
        source_url: formattedUrl,
        status: "processing"
      })
      .select()
      .single();

    if (sessionError) throw sessionError;
    logStep("Session created", { sessionId: session.id });

    // Use Firecrawl to scrape the page
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) throw new Error("Firecrawl not configured");

    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ["markdown", "html", "links"],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    const scrapeData = await scrapeResponse.json();
    if (!scrapeResponse.ok) {
      logStep("Firecrawl error", scrapeData);
      throw new Error(scrapeData.error || "Failed to scrape page");
    }

    logStep("Scrape successful", { contentLength: scrapeData.data?.markdown?.length });

    // Get user's buy boxes for matching
    const { data: buyBoxes } = await supabaseAdmin
      .from("buy_boxes")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (!buyBoxes || buyBoxes.length === 0) {
      throw new Error("No active buy boxes found. Please create a buy box first.");
    }

    logStep("Buy boxes loaded", { count: buyBoxes.length });

    // Prepare buy box criteria for AI
    const buyBoxCriteria = buyBoxes.map(bb => ({
      id: bb.id,
      name: bb.name,
      property_types: bb.property_types,
      deal_types: bb.deal_types,
      min_price: bb.min_price,
      max_price: bb.max_price,
      min_arv: bb.min_arv,
      max_arv: bb.max_arv,
      min_equity_percentage: bb.min_equity_percentage,
      target_cities: bb.target_cities,
      target_states: bb.target_states,
      target_zip_codes: bb.target_zip_codes,
      preferred_conditions: bb.preferred_conditions,
    }));

    // Use Lovable AI to analyze the scraped content
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("AI service not configured");

    const analysisPrompt = `You are a real estate investment analyst. Analyze the following Facebook/Marketplace content and extract property listings.

SCRAPED CONTENT:
${scrapeData.data?.markdown || scrapeData.markdown || "No content found"}

INVESTOR'S BUY BOX CRITERIA:
${JSON.stringify(buyBoxCriteria, null, 2)}

TASK:
1. Identify ALL property listings/deals mentioned in the content
2. For each property, extract: address, city, state, zip, asking_price, arv (after repair value), bedrooms, bathrooms, sqft, condition, property_type, deal_type, repair_estimate, equity_percentage, description
3. Match each property against the investor's buy box criteria
4. Calculate a match_score (0-100) based on how well it fits the criteria
5. Calculate a confidence_score (0-100) based on how confident you are in the extracted data accuracy
6. Only include properties with confidence_score >= 85
7. Limit to top 10 best matches

Respond with a JSON array of deals in this exact format:
{
  "deals": [
    {
      "address": "string",
      "city": "string", 
      "state": "string",
      "zip_code": "string",
      "asking_price": number,
      "arv": number,
      "bedrooms": number,
      "bathrooms": number,
      "sqft": number,
      "condition": "excellent|good|fair|poor|distressed",
      "property_type": "single_family|multi_family|condo|townhouse|commercial|land|mobile_home|other",
      "deal_type": "fix_and_flip|buy_and_hold|wholesale|subject_to|seller_finance|other",
      "repair_estimate": number,
      "equity_percentage": number,
      "description": "string",
      "match_score": number,
      "confidence_score": number,
      "matched_buy_box_id": "uuid of best matching buy box",
      "analysis_notes": "string explaining match and confidence reasoning"
    }
  ]
}

If no valid deals are found, return: {"deals": []}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a precise real estate data extraction AI. Always respond with valid JSON only." },
          { role: "user", content: analysisPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      logStep("AI error", { status: aiResponse.status, error: errorText });
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "{}";
    logStep("AI response received", { length: aiContent.length });

    // Parse AI response
    let parsedDeals: { deals: ScrapedDeal[] };
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedDeals = JSON.parse(jsonMatch[0]);
      } else {
        parsedDeals = { deals: [] };
      }
    } catch (parseError: unknown) {
      const message = parseError instanceof Error ? parseError.message : String(parseError);
      logStep("JSON parse error", { error: message });
      parsedDeals = { deals: [] };
    }

    const deals = parsedDeals.deals || [];
    logStep("Deals parsed", { count: deals.length });

    // Filter to only high-confidence deals (85%+)
    const highConfidenceDeals = deals
      .filter((d) => (d.confidence_score || 0) >= 85)
      .slice(0, 10);

    logStep("High confidence deals", { count: highConfidenceDeals.length });

    // Store results in database
    const resultsToInsert = highConfidenceDeals.map((deal) => ({
      user_id: userId,
      scrape_session_id: session.id,
      source_url: formattedUrl,
      post_content: scrapeData.data?.markdown?.substring(0, 5000) || null,
      extracted_data: deal,
      match_score: deal.match_score,
      confidence_score: deal.confidence_score,
      matched_buy_box_id: deal.matched_buy_box_id || null,
      analysis_notes: deal.analysis_notes,
    }));

    let insertedResults: { id: string }[] = [];
    if (resultsToInsert.length > 0) {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from("scrape_results")
        .insert(resultsToInsert)
        .select();

      if (insertError) {
        logStep("Insert error", insertError);
      } else {
        insertedResults = inserted || [];
      }
    }

    // Update session status
    await supabaseAdmin
      .from("scrape_sessions")
      .update({
        status: "completed",
        deals_found: highConfidenceDeals.length,
        completed_at: new Date().toISOString(),
      })
      .eq("id", session.id);

    // Deduct one scrape credit
    await supabaseAdmin
      .from("scrape_credits")
      .update({
        credits_remaining: credits.credits_remaining - 1,
        credits_used: credits.credits_used + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    logStep("Scrape completed successfully", {
      dealsFound: highConfidenceDeals.length,
      creditsRemaining: credits.credits_remaining - 1
    });

    // Merge inserted result IDs with deal data
    const dealsWithIds = highConfidenceDeals.map((deal, index) => ({
      ...deal,
      id: insertedResults[index]?.id || null,
      is_saved: false,
    }));

    return new Response(JSON.stringify({
      success: true,
      session_id: session.id,
      deals_found: highConfidenceDeals.length,
      deals: dealsWithIds,
      credits_remaining: credits.credits_remaining - 1,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: message });
    return new Response(JSON.stringify({
      success: false,
      error: message
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
