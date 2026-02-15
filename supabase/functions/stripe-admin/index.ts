import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const ALLOWED_ORIGINS = [
    "https://quickliqi.com",
    "https://www.quickliqi.com",
    "https://quickliqi.lovable.app",
    "http://localhost:8080",
    "http://localhost:5173",
];

function getCorsHeaders(origin?: string | null) {
    const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    return {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Vary": "Origin",
    };
}

const logStep = (step: string, details?: unknown) => {
    console.log(`[STRIPE-ADMIN] ${step}`, details ? JSON.stringify(details) : "");
};

serve(async (req) => {
    const origin = req.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin);

    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
    );

    const supabaseAuth = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    try {
        // ── Auth + Admin Check ──
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("No authorization header");

        const token = authHeader.replace("Bearer ", "");
        const { data: userData, error: authError } = await supabaseAuth.auth.getUser(token);
        if (authError || !userData.user) throw new Error("Authentication failed");

        const userId = userData.user.id;
        const userEmail = userData.user.email;

        // Check admin role
        const { data: roleData } = await supabaseAdmin
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .eq("role", "admin")
            .maybeSingle();

        const isAdmin = !!roleData || userEmail === "thomasdamienak@gmail.com";
        if (!isAdmin) {
            return new Response(JSON.stringify({ error: "Unauthorized: Admin access required" }), {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        logStep("Admin authenticated", { userId, email: userEmail });

        // ── Route ──
        const url = new URL(req.url);
        const action = url.searchParams.get("action") || "";

        // Also accept action from body for POST
        let bodyAction = action;
        let bodyData: Record<string, unknown> = {};
        if (req.method === "POST") {
            try {
                const parsed = await req.json();
                bodyAction = parsed.action || action;
                bodyData = parsed;
            } catch {
                // ignore parse errors for GET-like requests
            }
        }

        const finalAction = bodyAction || action;

        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

        const stripe = new Stripe(stripeKey, { apiVersion: "2025-04-30.basil" });

        switch (finalAction) {
            // ────────────────────────────────────────
            // Health Check — test Stripe connection
            // ────────────────────────────────────────
            case "health": {
                try {
                    const balance = await stripe.balance.retrieve();
                    const isLive = stripeKey.startsWith("sk_live_");
                    const isTest = stripeKey.startsWith("sk_test_");

                    return new Response(JSON.stringify({
                        connected: true,
                        environment: isLive ? "live" : isTest ? "test" : "unknown",
                        currency: balance.available?.[0]?.currency || "usd",
                        availableBalance: balance.available?.[0]?.amount || 0,
                        pendingBalance: balance.pending?.[0]?.amount || 0,
                    }), {
                        headers: { ...corsHeaders, "Content-Type": "application/json" },
                    });
                } catch (stripeErr: unknown) {
                    const msg = stripeErr instanceof Error ? stripeErr.message : String(stripeErr);
                    return new Response(JSON.stringify({
                        connected: false,
                        error: msg,
                        environment: "unknown",
                    }), {
                        headers: { ...corsHeaders, "Content-Type": "application/json" },
                    });
                }
            }

            // ────────────────────────────────────────
            // Webhook Events — paginated log
            // ────────────────────────────────────────
            case "webhook-events": {
                const page = parseInt(url.searchParams.get("page") || "1", 10);
                const limit = parseInt(url.searchParams.get("limit") || "20", 10);
                const statusFilter = url.searchParams.get("status");
                const typeFilter = url.searchParams.get("type");

                let query = supabaseAdmin
                    .from("webhook_events")
                    .select("*", { count: "exact" })
                    .order("created_at", { ascending: false })
                    .range((page - 1) * limit, page * limit - 1);

                if (statusFilter) query = query.eq("processing_status", statusFilter);
                if (typeFilter) query = query.eq("event_type", typeFilter);

                const { data: events, count, error: queryError } = await query;

                if (queryError) throw new Error(`Query failed: ${queryError.message}`);

                return new Response(JSON.stringify({
                    events: events || [],
                    total: count || 0,
                    page,
                    limit,
                }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            // ────────────────────────────────────────
            // Retry failed webhook — re-process
            // ────────────────────────────────────────
            case "retry-webhook": {
                const eventId = bodyData.eventId as string;
                if (!eventId) throw new Error("eventId is required");

                // Fetch from our log
                const { data: eventRecord } = await supabaseAdmin
                    .from("webhook_events")
                    .select("*")
                    .eq("id", eventId)
                    .maybeSingle();

                if (!eventRecord) throw new Error("Webhook event not found");

                // Mark as pending for re-processing
                await supabaseAdmin
                    .from("webhook_events")
                    .update({ processing_status: "pending", error_message: null })
                    .eq("id", eventId);

                // Audit log
                await supabaseAdmin.from("financial_audit_log").insert({
                    actor_id: userId,
                    action: "webhook_retry_requested",
                    resource_type: "webhook_event",
                    resource_id: eventId,
                    details: { stripeEventId: eventRecord.stripe_event_id, eventType: eventRecord.event_type },
                });

                logStep("Webhook retry requested", { eventId, stripeEventId: eventRecord.stripe_event_id });

                return new Response(JSON.stringify({
                    success: true,
                    message: "Event marked for re-processing",
                    eventId,
                }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            // ────────────────────────────────────────
            // Reconciliation Report
            // ────────────────────────────────────────
            case "reconciliation": {
                // Count DB records
                const { count: dbTransactions } = await supabaseAdmin
                    .from("payment_transactions")
                    .select("*", { count: "exact", head: true });

                const { count: dbSubscriptions } = await supabaseAdmin
                    .from("subscriptions")
                    .select("*", { count: "exact", head: true });

                const { count: dbCredits } = await supabaseAdmin
                    .from("listing_credits")
                    .select("*", { count: "exact", head: true });

                const { count: dbScrapeCredits } = await supabaseAdmin
                    .from("scrape_credits")
                    .select("*", { count: "exact", head: true });

                // Count Stripe records
                let stripeCustomerCount = 0;
                let stripeSubscriptionCount = 0;
                try {
                    const customers = await stripe.customers.list({ limit: 1 });
                    stripeCustomerCount = customers.data.length > 0 ? (customers as unknown as { total_count: number }).total_count || customers.data.length : 0;

                    const subscriptions = await stripe.subscriptions.list({ limit: 100, status: "all" });
                    stripeSubscriptionCount = subscriptions.data.length;
                } catch (e: unknown) {
                    logStep("Reconciliation Stripe query error", { error: e instanceof Error ? e.message : String(e) });
                }

                // Failed webhooks
                const { count: failedWebhooks } = await supabaseAdmin
                    .from("webhook_events")
                    .select("*", { count: "exact", head: true })
                    .eq("processing_status", "failed");

                // Recent payment failures
                const { data: recentFailures } = await supabaseAdmin
                    .from("payment_transactions")
                    .select("*")
                    .eq("status", "failed")
                    .order("created_at", { ascending: false })
                    .limit(10);

                return new Response(JSON.stringify({
                    database: {
                        transactions: dbTransactions || 0,
                        subscriptions: dbSubscriptions || 0,
                        listingCredits: dbCredits || 0,
                        scrapeCredits: dbScrapeCredits || 0,
                    },
                    stripe: {
                        customers: stripeCustomerCount,
                        subscriptions: stripeSubscriptionCount,
                    },
                    issues: {
                        failedWebhooks: failedWebhooks || 0,
                        recentPaymentFailures: recentFailures || [],
                    },
                    generatedAt: new Date().toISOString(),
                }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            // ────────────────────────────────────────
            // Manual Refund — super admin only
            // ────────────────────────────────────────
            case "refund": {
                const paymentIntentId = bodyData.paymentIntentId as string;
                const amount = bodyData.amount as number | undefined;
                const reason = (bodyData.reason as string) || "requested_by_customer";

                if (!paymentIntentId) throw new Error("paymentIntentId is required");

                logStep("Refund requested", { paymentIntentId, amount, reason, by: userEmail });

                // Issue refund through Stripe
                const refundParams: Stripe.RefundCreateParams = {
                    payment_intent: paymentIntentId,
                    reason: reason as Stripe.RefundCreateParams.Reason,
                };
                if (amount) refundParams.amount = amount;

                const refund = await stripe.refunds.create(refundParams);

                // Update transaction
                await supabaseAdmin
                    .from("payment_transactions")
                    .update({ status: "refunded" })
                    .eq("stripe_payment_intent_id", paymentIntentId);

                // Audit log
                await supabaseAdmin.from("financial_audit_log").insert({
                    actor_id: userId,
                    action: "manual_refund_issued",
                    resource_type: "refund",
                    resource_id: refund.id,
                    details: {
                        paymentIntentId,
                        refundAmount: refund.amount,
                        currency: refund.currency,
                        reason,
                        adminEmail: userEmail,
                    },
                });

                logStep("Refund issued", { refundId: refund.id, amount: refund.amount });

                return new Response(JSON.stringify({
                    success: true,
                    refundId: refund.id,
                    amount: refund.amount,
                    currency: refund.currency,
                    status: refund.status,
                }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            // ────────────────────────────────────────
            // Audit Log
            // ────────────────────────────────────────
            case "audit-log": {
                const page = parseInt(url.searchParams.get("page") || "1", 10);
                const limit = parseInt(url.searchParams.get("limit") || "50", 10);

                const { data: logs, count } = await supabaseAdmin
                    .from("financial_audit_log")
                    .select("*", { count: "exact" })
                    .order("created_at", { ascending: false })
                    .range((page - 1) * limit, page * limit - 1);

                return new Response(JSON.stringify({
                    logs: logs || [],
                    total: count || 0,
                    page,
                    limit,
                }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            default:
                return new Response(JSON.stringify({
                    error: `Unknown action: ${finalAction}`,
                    availableActions: ["health", "webhook-events", "retry-webhook", "reconciliation", "refund", "audit-log"],
                }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logStep("ERROR", { message: errorMessage });
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
