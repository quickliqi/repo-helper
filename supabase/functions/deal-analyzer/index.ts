import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

interface DealPayload {
    title: string;
    price: number;
    location: string;
    source: string;
    description: string;
    link: string;
    ai_score: number;
    reasoning: string;
    metrics: {
        arv: number;
        mao: number;
        roi: number;
        equityPercentage: number;
        score: number;
        riskFactors: string[];
        grossEquity: number;
        projectedProfit: number;
    } | null;
    validated: boolean;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    bedrooms?: number;
    bathrooms?: number;
    sqft?: number;
    property_type?: string;
    condition?: string;
}

interface AuditAlert {
    severity: string;
    message: string;
    category: string;
}

interface AuditPayload {
    overallScore: number;
    pass: boolean;
    alerts: AuditAlert[];
    integrity: unknown[];
}

interface LovableAiResponse {
    choices?: Array<{
        message?: {
            content?: string;
        };
    }>;
}

// ─── Deal System Prompt ────────────────────────────────────────────
function buildDealSystemPrompt(deal: DealPayload): string {
    const metricsBlock = deal.metrics
        ? `
KEY METRICS:
- ARV (After Repair Value): $${deal.metrics.arv.toLocaleString()}
- MAO (Maximum Allowable Offer): $${deal.metrics.mao.toLocaleString()}
- Gross Equity: $${deal.metrics.grossEquity.toLocaleString()} (${deal.metrics.equityPercentage.toFixed(1)}%)
- Projected Profit: $${deal.metrics.projectedProfit.toLocaleString()}
- ROI: ${deal.metrics.roi.toFixed(1)}%
- Deal Score: ${deal.metrics.score}/100
- Risk Factors: ${deal.metrics.riskFactors.length > 0 ? deal.metrics.riskFactors.join("; ") : "None identified"}`
        : "\nMETRICS: Insufficient data for full underwriting.";

    return `You are a senior real estate underwriter and investment analyst with 20+ years of experience in residential acquisitions, fix-and-flip, wholesale, and buy-and-hold strategies.

You are analyzing a SPECIFIC deal. All of your answers must reference the concrete numbers and facts from this property. Never give generic advice — always ground your response in this deal's data.

PROPERTY UNDER ANALYSIS:
- Title: ${deal.title}
- Asking Price: $${deal.price.toLocaleString()}
- Location: ${deal.location}
- Source: ${deal.source}
- Validated: ${deal.validated ? "Yes" : "No"}
- AI Score: ${deal.ai_score}/100
${metricsBlock}

PROPERTY DETAILS:
- Address: ${deal.address || "Not available"}
- Bedrooms: ${deal.bedrooms ?? "Unknown"}
- Bathrooms: ${deal.bathrooms ?? "Unknown"}
- Sq Ft: ${deal.sqft ?? "Unknown"}
- Property Type: ${deal.property_type || "Unknown"}
- Condition: ${deal.condition || "Unknown"}

DESCRIPTION:
${deal.description || "No description available."}

AI REASONING:
${deal.reasoning}

INSTRUCTIONS:
1. Always reference the specific numbers (price, MAO, ARV, equity %) when answering.
2. If the user asks about comps, provide analysis based on the location and price point.
3. If asked about renovation costs, factor in the condition and square footage.
4. Be direct and actionable. Use bullet points for clarity.
5. If data is missing (e.g., no ARV), flag it as a risk and explain what the user should verify.
6. Keep responses concise — 2-4 paragraphs max unless the user asks for a deep dive.`;
}

// ─── Audit System Prompt ───────────────────────────────────────────
function buildAuditSystemPrompt(audit: AuditPayload): string {
    const alertsSummary = audit.alerts
        .map((a) => `[${a.severity.toUpperCase()}] (${a.category}) ${a.message}`)
        .join("\n");

    return `You are a senior QA engineer and data integrity auditor for a real estate scraping platform. You have deep expertise in web scraping reliability, data validation, and real estate data standards (MLS, FSBO, public records).

You are reviewing a SPECIFIC scrape audit report. All of your answers must reference the concrete alerts and scores from this report.

AUDIT REPORT:
- Overall Score: ${audit.overallScore}/100
- Status: ${audit.pass ? "PASS" : "REVIEW NEEDED"}
- Total Alerts: ${audit.alerts.length}
- Critical: ${audit.alerts.filter((a) => a.severity === "critical").length}
- Warnings: ${audit.alerts.filter((a) => a.severity === "warning").length}
- Info: ${audit.alerts.filter((a) => a.severity === "info").length}

ALERTS:
${alertsSummary || "No alerts found."}

INSTRUCTIONS:
1. Always reference specific alerts by their category and severity when answering.
2. Explain what each alert means in practical terms — how it affects the scraped data quality.
3. Prioritize critical issues first and suggest concrete remediation steps.
4. If the user asks about a specific category, provide deep analysis of related alerts.
5. Be direct and actionable. Use bullet points for clarity.
6. Keep responses concise — 2-4 paragraphs max unless the user asks for a deep dive.`;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    try {
        // Authenticate
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("No authorization header");

        const token = authHeader.replace("Bearer ", "");
        const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
        if (userError || !userData.user) throw new Error("User not authenticated");

        console.log(`[DEAL-ANALYZER] User ${userData.user.id} started chat`);

        // Parse request
        const body = await req.json() as {
            message: string;
            contextType?: "deal" | "audit";
            deal?: DealPayload;
            auditReport?: AuditPayload;
            history: ChatMessage[];
        };

        const { message, contextType, deal, auditReport, history } = body;

        if (!message) {
            throw new Error("Missing required field: message");
        }

        // Determine context and build system prompt
        let systemPrompt: string;
        const resolvedContext = contextType || (deal ? "deal" : "audit");

        if (resolvedContext === "deal") {
            if (!deal) throw new Error("Missing required field: deal");
            systemPrompt = buildDealSystemPrompt(deal);
        } else {
            if (!auditReport) throw new Error("Missing required field: auditReport");
            systemPrompt = buildAuditSystemPrompt(auditReport);
        }

        const lovableKey = Deno.env.get("LOVABLE_API_KEY");
        if (!lovableKey) {
            throw new Error("AI service not configured");
        }

        // Build messages array for the AI
        const messages: ChatMessage[] = [
            { role: "system", content: systemPrompt },
            ...(history || []).slice(-20),
            { role: "user", content: message },
        ];

        console.log(`[DEAL-ANALYZER] Context: ${resolvedContext}, sending ${messages.length} messages to AI`);

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${lovableKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages,
            }),
        });

        if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            console.error(`[DEAL-ANALYZER] AI API error: ${aiResponse.status} - ${errorText}`);
            throw new Error("AI service temporarily unavailable");
        }

        const aiData: LovableAiResponse = await aiResponse.json();
        const reply = aiData.choices?.[0]?.message?.content || "I wasn't able to generate a response. Please try rephrasing your question.";

        console.log(`[DEAL-ANALYZER] Response generated (${reply.length} chars)`);

        return new Response(JSON.stringify({ reply }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(`[DEAL-ANALYZER] ERROR: ${errMsg}`);
        return new Response(JSON.stringify({ error: errMsg }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
