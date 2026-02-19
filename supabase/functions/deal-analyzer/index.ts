import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import { calculateMetrics, cleanNumber } from "../_shared/dealMath.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, sentry-trace, baggage",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

interface DealPayload {
    title: string;
    price: number | string; // Allow string input for sanitization
    location: string;
    source: string;
    description: string;
    link: string;
    ai_score: number | string;
    reasoning: string;
    metrics: {
        arv: number | string;
        mao: number | string;
        roi: number | string;
        equityPercentage: number | string;
        score: number | string;
        riskFactors: string[];
        grossEquity: number | string;
        projectedProfit: number | string;
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

// ─── Deal System Prompt ────────────────────────────────────────────
function buildDealSystemPrompt(deal: DealPayload): string {
    // Sanitize inputs for the prompt
    const safePrice = cleanNumber(deal.price);
    const safeScore = cleanNumber(deal.ai_score);

    let metricsBlock = "\nMETRICS: Insufficient data for full underwriting.";

    if (deal.metrics) {
        const arv = cleanNumber(deal.metrics.arv);
        const mao = cleanNumber(deal.metrics.mao);
        const grossEquity = cleanNumber(deal.metrics.grossEquity);
        const equityPercent = cleanNumber(deal.metrics.equityPercentage);
        const profit = cleanNumber(deal.metrics.projectedProfit);
        const roi = cleanNumber(deal.metrics.roi);
        const score = cleanNumber(deal.metrics.score);

        metricsBlock = `
KEY METRICS:
- ARV (After Repair Value): $${arv.toLocaleString()}
- MAO (Maximum Allowable Offer): $${mao.toLocaleString()}
- Gross Equity: $${grossEquity.toLocaleString()} (${equityPercent.toFixed(1)}%)
- Projected Profit: $${profit.toLocaleString()}
- ROI: ${roi.toFixed(1)}%
- Deal Score: ${score}/100
- Risk Factors: ${deal.metrics.riskFactors.length > 0 ? deal.metrics.riskFactors.join("; ") : "None identified"}`;
    }

    return `You are a senior real estate underwriter and investment analyst with 20+ years of experience in residential acquisitions, fix-and-flip, wholesale, and buy-and-hold strategies.

You are analyzing a SPECIFIC deal. All of your answers must reference the concrete numbers and facts from this property. Never give generic advice — always ground your response in this deal's data.

PROPERTY UNDER ANALYSIS:
- Title: ${deal.title}
- Asking Price: $${safePrice.toLocaleString()}
- Location: ${deal.location}
- Source: ${deal.source}
- Validated: ${deal.validated ? "Yes" : "No"}
- AI Score: ${safeScore}/100
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
4. CRITICAL: Output responses in plain text only. Do NOT use markdown formatting (no asterisks, no hashes, no special characters for lists). Separate all paragraphs and list items with double line breaks for readability.
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
5. CRITICAL: Output responses in plain text only. Do NOT use markdown formatting (no asterisks, no hashes, no special characters for lists). Separate all paragraphs and list items with double line breaks for readability.
6. Keep responses concise — 2-4 paragraphs max unless the user asks for a deep dive.`;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
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

            // Enforce Shared Math Logic (Sync with Frontend)
            const price = cleanNumber(deal.price);
            const arv = cleanNumber(deal.metrics?.arv || deal.price); // Fallback to price if ARV missing
            const metrics = calculateMetrics(
                arv,
                price,
                0, // Repairs not typically passed in basic deal object, but if we have it:
                0, // Assignment
                deal.condition || 'fair'
            );

            // Override metrics with strict calculation
            deal.metrics = {
                ...metrics,
                // Preserve original ARV if it existed, otherwise use what we calculated/cleaned
                arv: deal.metrics?.arv || arv,
                // Merge other props if needed
                riskFactors: metrics.riskFactors
            };

            systemPrompt = buildDealSystemPrompt(deal);
        } else {
            if (!auditReport) throw new Error("Missing required field: auditReport");
            systemPrompt = buildAuditSystemPrompt(auditReport);
        }

        const googleApiKey = Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY");
        if (!googleApiKey) {
            console.error("[DEAL-ANALYZER] Missing GOOGLE_GENERATIVE_AI_API_KEY");
            throw new Error("AI service not configured (Missing GOOGLE_GENERATIVE_AI_API_KEY)");
        }

        // Initialize Google Generative AI
        const genAI = new GoogleGenerativeAI(googleApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Build chat history for Gemini
        // Filter out system messages as they are not supported in history array for Gemini
        // System prompt is handled separately if needed, or prepended to the first message context
        // For simplicity with this SDK version, we'll prepend the system prompt context to the current interaction
        // if history is empty, or treat it as context. 
        // Better yet: Gemini supports systemInstruction in newer models/SDKs, but let's stick to the reliable context injection method.

        // Transform history to Gemini format
        const chatHistory = (history || []).filter(msg => msg.role !== 'system').map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        console.log(`[DEAL-ANALYZER] Context: ${resolvedContext}, sending ${chatHistory.length} history messages to Gemini`);

        const chat = model.startChat({
            history: chatHistory,
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        // Prepend system prompt to the user message for context
        // This is a robust way to ensure the model follows instructions without needing specific systemInstruction support in all environments
        const fullMessage = `${systemPrompt}\n\nUSER QUESTION: ${message}`;

        const result = await chat.sendMessage(fullMessage);
        const reply = result.response.text();

        console.log(`[DEAL-ANALYZER] Response generated (${reply.length} chars)`);

        return new Response(JSON.stringify({ reply }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(`[DEAL-ANALYZER] CRITICAL ERROR: ${errMsg}`);

        // Return 200 with error property so frontend can display it gracefully
        // instead of crashing with a "non-2xx" status code
        return new Response(JSON.stringify({
            reply: `I encountered an error: ${errMsg}`,
            error: errMsg
        }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
