import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SCRAPE-DEALS] ${step}${detailsStr}`);
};

// Rate limit: 5 requests per minute per user
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MINUTES = 1;

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
    let parsedDeals;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedDeals = JSON.parse(jsonMatch[0]);
      } else {
        parsedDeals = { deals: [] };
      }
    } catch (parseError: any) {
      logStep("JSON parse error", { error: parseError.message });
      parsedDeals = { deals: [] };
    }

    const deals = parsedDeals.deals || [];
    logStep("Deals parsed", { count: deals.length });

    // Filter to only high-confidence deals (85%+)
    const highConfidenceDeals = deals
      .filter((d: any) => d.confidence_score >= 85)
      .slice(0, 10);

    logStep("High confidence deals", { count: highConfidenceDeals.length });

    // Store results in database
    const resultsToInsert = highConfidenceDeals.map((deal: any) => ({
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

    let insertedResults: any[] = [];
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
    const dealsWithIds = highConfidenceDeals.map((deal: any, index: number) => ({
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
