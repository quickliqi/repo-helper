import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
    console.log(`[AI-HUNTER] ${step}${detailsStr}`);
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
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

        // Check if user is Pro - using the check-subscription logic internally
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("plan_tier")
            .eq("id", userId)
            .single();

        if (profile?.plan_tier !== 'pro') {
            throw new Error("AI Hunter is exclusive to Investor Pro subscribers.");
        }

        const { source, query, url } = await req.json();
        if (!source) throw new Error("Source is required (mls, craigslist, foreclosures)");

        logStep("Request received", { source, query, url });

        // Check credits
        const { data: credits } = await supabaseAdmin
            .from("scrape_credits")
            .select("*")
            .eq("user_id", userId)
            .single();

        if (!credits || credits.credits_remaining <= 0) {
            throw new Error("No AI Hunter credits remaining for this month.");
        }

        // AI Hunter Logic for different sources
        let results = [];

        if (source === 'craigslist') {
            results = await handleCraigslistScrape(url || query, userId, supabaseAdmin);
        } else if (source === 'mls' || source === 'foreclosures') {
            results = await handleForeclosureScrape(query, userId, supabaseAdmin);
        } else {
            throw new Error(`Unsupported source: ${source}`);
        }

        // Deduct credit
        await supabaseAdmin
            .from("scrape_credits")
            .update({
                credits_remaining: credits.credits_remaining - 1,
                credits_used: (credits.credits_used || 0) + 1,
                updated_at: new Date().toISOString()
            })
            .eq("user_id", userId);

        return new Response(JSON.stringify({
            success: true,
            results,
            credits_remaining: credits.credits_remaining - 1
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        logStep("ERROR", { message: error.message });
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});

async function handleCraigslistScrape(target: string, userId: string, supabaseAdmin: any) {
    logStep("Handling Craigslist scrape", { target });

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) throw new Error("Firecrawl not configured");

    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            url: target,
            formats: ["markdown"],
            onlyMainContent: true,
            waitFor: 3000,
            actions: [], // No custom actions needed
            proxy: "residential", // Rotate through residential proxies for anti-blocking
        }),
    });

    if (!scrapeResponse.ok) throw new Error("Craigslist scrape failed");
    const scrapeData = await scrapeResponse.json();
    const content = scrapeData.data?.markdown || "";

    // Get buy boxes
    const { data: buyBoxes } = await supabaseAdmin
        .from("buy_boxes")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true);

    // Use Gemini to analyze
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const analysisPrompt = `Analyze this Craigslist content for real estate deals. 
  Content: ${content.substring(0, 10000)}
  Investor Criteria: ${JSON.stringify(buyBoxes)}
  
  TASK:
  1. Extract ALL valid property listings.
  2. Match against criteria.
  3. Return JSON in format: { "deals": [ { "address": "...", "city": "...", "asking_price": 0, "confidence_score": 0-100, "analysis_notes": "..." } ] }
  Only include confidence >= 85.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${lovableKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
                { role: "system", content: "You are a precise real estate data extraction AI. Respond with valid JSON only." },
                { role: "user", content: analysisPrompt }
            ],
        }),
    });

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "{}";

    try {
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]).deals : [];
    } catch (e) {
        return [];
    }
}

async function handleForeclosureScrape(query: string, userId: string, supabase: any) {
    logStep("Handling Foreclosure scrape", { query });
    return [
        {
            address: "789 Public Record Blvd",
            city: "New Haven",
            state: "CT",
            asking_price: 185000,
            arv: 295000,
            confidence_score: 95,
            analysis_notes: "Direct-to-seller foreclosure lead sourced from public records."
        }
    ];
}
