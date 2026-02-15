import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const ALLOWED_ORIGINS = [
  "https://quickliqi.com",
  "https://www.quickliqi.com",
  "https://quickliqi.lovable.app",
  "https://realquickliqi.lovable.app",
];

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin.endsWith(".lovableproject.com") || origin.endsWith(".lovable.app")) return true;
  return false;
}

function getCorsHeaders(origin?: string | null) {
  const allowedOrigin = origin && isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SCRAPE-SUB] ${step}${detailsStr}`);
};

// Rate limit: 30 requests per minute per user (higher for status checks)
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MINUTES = 1;

// Investor Scraping Pro product ID
const SCRAPE_PRODUCT_ID = "prod_Ti4uCt003AN32Y";

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use ANON_KEY for user token validation
  const supabaseAuth = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  // Use SERVICE_ROLE_KEY for database operations (bypasses RLS)
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !userData.user) throw new Error("User not authenticated");

    const user = userData.user;
    logStep("User authenticated", { email: user.email });

    // Check rate limit
    const { data: rateLimitOk, error: rlError } = await supabaseAdmin.rpc("check_rate_limit", {
      p_user_id: user.id,
      p_function_name: "check-scrape-subscription",
      p_max_requests: RATE_LIMIT_MAX,
      p_window_minutes: RATE_LIMIT_WINDOW_MINUTES,
    });

    if (rlError) {
      logStep("Rate limit check error", { error: rlError.message });
    }

    if (rateLimitOk === false) {
      logStep("Rate limit exceeded", { userId: user.id });
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait before making more requests." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-04-30.basil",
    });

    // Find customer by email
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({
        subscribed: false,
        credits_remaining: 0,
        credits_used: 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = customers.data[0].id;
    logStep("Customer found", { customerId });

    // Check for active scrape subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10,
    });

    const scrapeSubscription = subscriptions.data.find((sub) =>
      sub.items.data.some((item) => item.price.product === SCRAPE_PRODUCT_ID)
    );

    if (!scrapeSubscription) {
      logStep("No active scrape subscription");

      // Check if user has existing credits record
      const { data: existingCredits } = await supabaseAdmin
        .from("scrape_credits")
        .select("*")
        .eq("user_id", user.id)
        .single();

      return new Response(JSON.stringify({
        subscribed: false,
        credits_remaining: existingCredits?.credits_remaining || 0,
        credits_used: existingCredits?.credits_used || 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Active scrape subscription found", {
      subscriptionId: scrapeSubscription.id,
      periodEnd: new Date(scrapeSubscription.current_period_end * 1000).toISOString()
    });

    // Get or create credits record
    const { data: existingCredits } = await supabaseAdmin
      .from("scrape_credits")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const periodStart = new Date(scrapeSubscription.current_period_start * 1000).toISOString();
    const periodEnd = new Date(scrapeSubscription.current_period_end * 1000).toISOString();

    if (!existingCredits) {
      // Create new credits record with 10 credits
      await supabaseAdmin
        .from("scrape_credits")
        .insert({
          user_id: user.id,
          credits_remaining: 10,
          credits_used: 0,
          subscription_active: true,
          stripe_subscription_id: scrapeSubscription.id,
          current_period_start: periodStart,
          current_period_end: periodEnd,
        });

      logStep("Created new credits record");

      return new Response(JSON.stringify({
        subscribed: true,
        credits_remaining: 10,
        credits_used: 0,
        period_end: periodEnd,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if we need to reset credits for new billing period
    const existingPeriodStart = existingCredits.current_period_start
      ? new Date(existingCredits.current_period_start).getTime()
      : 0;
    const newPeriodStart = scrapeSubscription.current_period_start * 1000;

    if (newPeriodStart > existingPeriodStart) {
      // New billing period - reset credits to 10
      await supabaseAdmin
        .from("scrape_credits")
        .update({
          credits_remaining: 10,
          credits_used: 0,
          subscription_active: true,
          stripe_subscription_id: scrapeSubscription.id,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      logStep("Reset credits for new billing period");

      return new Response(JSON.stringify({
        subscribed: true,
        credits_remaining: 10,
        credits_used: 0,
        period_end: periodEnd,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update subscription status
    await supabaseAdmin
      .from("scrape_credits")
      .update({
        subscription_active: true,
        stripe_subscription_id: scrapeSubscription.id,
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    return new Response(JSON.stringify({
      subscribed: true,
      credits_remaining: existingCredits.credits_remaining,
      credits_used: existingCredits.credits_used,
      period_end: periodEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
