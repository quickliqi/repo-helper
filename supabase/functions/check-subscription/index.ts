import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[CHECK-SUBSCRIPTION] ${step}`, details ? JSON.stringify(details) : "");
};

// Rate limit: 30 requests per minute per user (higher for status checks)
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MINUTES = 1;

serve(async (req) => {
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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user is an admin (database role OR email fallback)
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    const isAdmin = !!roleData || user.email === "thomasdamienak@gmail.com";
    logStep("Admin check", { isAdmin, hasDbRole: !!roleData, email: user.email });

    if (isAdmin) {
      logStep("Admin bypass - returning full access status");
      return new Response(JSON.stringify({
        subscribed: true,
        trialing: false,
        subscription_end: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 10 years
        trial_end: null,
        plan_tier: 'pro',
        listing_credits: 999,
        scrape_credits: 999,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check rate limit
    const { data: rateLimitOk, error: rlError } = await supabaseAdmin.rpc("check_rate_limit", {
      p_user_id: user.id,
      p_function_name: "check-subscription",
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

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check subscription status in Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");

      // Check listing credits from database
      const { data: credits } = await supabaseAdmin
        .from("listing_credits")
        .select("credits_remaining")
        .eq("user_id", user.id)
        .single();

      return new Response(JSON.stringify({
        subscribed: false,
        trialing: false,
        subscription_end: null,
        listing_credits: credits?.credits_remaining || 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active or trialing subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
    });

    let subscribed = false;
    let trialing = false;
    let subscriptionEnd = null;
    let trialEnd = null;
    let planTier: 'basic' | 'pro' | null = null;

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      subscribed = ["active", "trialing"].includes(subscription.status);
      trialing = subscription.status === "trialing";
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();

      if (subscription.trial_end) {
        trialEnd = new Date(subscription.trial_end * 1000).toISOString();
      }

      // Determine plan tier (from .lovable/plan.md)
      const priceId = subscription.items.data[0]?.price.id;
      if (priceId === "price_1SjI8j0VL3B5XXLHB1xRD8Bb") {
        planTier = 'pro'; // Investor Pro subscription
      }

      logStep("Subscription found", {
        status: subscription.status,
        subscribed,
        trialing,
        subscriptionEnd,
        planTier
      });
    }

    // Get listing credits
    const { data: credits } = await supabaseAdmin
      .from("listing_credits")
      .select("credits_remaining")
      .eq("user_id", user.id)
      .single();

    // Get scrape credits (Pro only)
    let scrapeCredits = 0;
    if (planTier === 'pro') {
      const { data: sCredits } = await supabaseAdmin
        .from("scrape_credits")
        .select("credits_remaining")
        .eq("user_id", user.id)
        .single();

      if (sCredits) {
        scrapeCredits = sCredits.credits_remaining;
      } else {
        // Initialize credits if Pro but no record
        await supabaseAdmin.from("scrape_credits").insert({
          user_id: user.id,
          credits_remaining: 10,
          subscription_active: true
        });
        scrapeCredits = 10;
      }
    }

    return new Response(JSON.stringify({
      subscribed,
      trialing,
      subscription_end: subscriptionEnd,
      trial_end: trialEnd,
      plan_tier: planTier,
      listing_credits: credits?.credits_remaining || 0,
      scrape_credits: scrapeCredits,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
