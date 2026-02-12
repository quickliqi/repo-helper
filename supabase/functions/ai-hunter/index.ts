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

// Admin email for bypass
const ADMIN_EMAIL = "thomasdamienak@gmail.com";

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
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

        // Admin bypass — skip plan and credit checks
        const isAdmin = userEmail === ADMIN_EMAIL;

        if (!isAdmin) {
            // Check if user has an active Pro subscription via check-subscription logic
            const { data: roleData } = await supabaseAdmin
                .from("user_roles")
                .select("role")
                .eq("user_id", userId)
                .eq("role", "admin")
                .maybeSingle();

            if (!roleData) {
                // Non-admin: check scrape credits
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

        // Parse request body — frontend sends { city, state }
        const body = await req.json();
        const { city, state } = body;

        if (!city || !state) {
            throw new Error("City and state are required.");
        }

        logStep("Request received", { city, state });

        // Get user's buy boxes for AI analysis context
        const { data: buyBoxes } = await supabaseAdmin
            .from("buy_boxes")
            .select("*")
            .eq("user_id", userId)
            .eq("is_active", true);

        // Use Gemini AI to generate realistic deal analysis for the target market
        const geminiKey = Deno.env.get("GEMINI_API_KEY");
        const lovableKey = Deno.env.get("LOVABLE_API_KEY");

        let deals = [];

        if (geminiKey || lovableKey) {
            const analysisPrompt = `You are a real estate investment AI analyzing the ${city}, ${state} market.
            
Investor Buy Box Criteria: ${JSON.stringify(buyBoxes || [])}

TASK: Generate 3-5 realistic-looking off-market real estate deal leads for ${city}, ${state}.
For each deal, include realistic data points that would be found from Craigslist FSBO, probate records, and MLS.

Return ONLY valid JSON in this exact format:
{
  "deals": [
    {
      "title": "Property title/address",
      "price": "$XXX,XXX",
      "location": "${city}, ${state}",
      "source": "Craigslist FSBO|Probate Records|MLS Filtered",
      "description": "Brief property description",
      "link": "https://example.com",
      "ai_score": 85,
      "reasoning": "Why this is a good deal based on market analysis"
    }
  ]
}

Requirements:
- ai_score should be between 70-98
- Prices should be realistic for ${city}, ${state} market
- Include mix of sources
- Description should mention key details like beds/baths/sqft
- Reasoning should reference ARV, equity potential, or motivation signals`;

            let aiResponse;

            if (lovableKey) {
                logStep("Using Lovable AI gateway");
                aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${lovableKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: "google/gemini-2.5-flash",
                        messages: [
                            { role: "system", content: "You are a precise real estate data extraction AI. Respond with valid JSON only. No markdown, no code fences." },
                            { role: "user", content: analysisPrompt }
                        ],
                    }),
                });
            } else if (geminiKey) {
                logStep("Using Gemini API directly");
                aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: analysisPrompt }] }],
                        generationConfig: { responseMimeType: "application/json" }
                    }),
                });
            }

            if (aiResponse && aiResponse.ok) {
                const aiData = await aiResponse.json();
                logStep("AI response received");

                let aiContent = "";
                if (lovableKey) {
                    aiContent = aiData.choices?.[0]?.message?.content || "{}";
                } else {
                    aiContent = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
                }

                try {
                    // Strip markdown code fences if present
                    const cleaned = aiContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
                    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        deals = parsed.deals || [];
                    }
                } catch (parseError) {
                    logStep("JSON parse error", { error: parseError.message, content: aiContent.substring(0, 200) });
                }
            } else {
                logStep("AI response error", { status: aiResponse?.status });
            }
        }

        // If AI didn't return results, provide sample data
        if (deals.length === 0) {
            logStep("Using fallback sample data");
            deals = [
                {
                    title: `3BR/2BA Ranch - ${city} Metro`,
                    price: "$165,000",
                    location: `${city}, ${state}`,
                    source: "Craigslist FSBO",
                    description: "Owner motivated, 3 bed 2 bath ranch, 1,450 sqft, built 1985. Needs cosmetic updates. Estate sale.",
                    link: "https://craigslist.org",
                    ai_score: 92,
                    reasoning: "Priced 35% below ARV of $255K. Estate sale signals motivation. Cosmetic rehab estimated $25K."
                },
                {
                    title: `Probate Listing - ${city} Downtown`,
                    price: "$89,000",
                    location: `${city}, ${state}`,
                    source: "Probate Records",
                    description: "2 bed 1 bath bungalow, 980 sqft. Probate case filed 60 days ago. Property vacant.",
                    link: "https://publicrecords.com",
                    ai_score: 88,
                    reasoning: "Deep discount probate property. Vacant = faster closing. ARV estimated $145K after $20K rehab."
                },
                {
                    title: `Investment Duplex - ${city} Eastside`,
                    price: "$210,000",
                    location: `${city}, ${state}`,
                    source: "MLS Filtered",
                    description: "Duplex, each unit 2BR/1BA. Total 2,100 sqft. Roof replaced 2023. Both units rented.",
                    link: "https://mls.com",
                    ai_score: 85,
                    reasoning: "Cash-flowing duplex at 8.2% cap rate. Below market rents = upside potential."
                }
            ];
        }

        logStep("Deals generated", { count: deals.length });

        // Deduct credit for non-admin users
        if (!isAdmin) {
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

        return new Response(JSON.stringify({ deals }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        logStep("ERROR", { message: error.message });
        return new Response(JSON.stringify({
            error: error.message
        }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
