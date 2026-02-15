import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const ALLOWED_ORIGINS = [
  "https://quickliqi.com",
  "https://www.quickliqi.com",
  "https://quickliqi.lovable.app",
];

function getCorsHeaders(origin?: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

const logStep = (step: string, details?: unknown) => {
  console.log(`[CREATE-CHECKOUT] ${step}`, details ? JSON.stringify(details) : "");
};

// Rate limit: 10 requests per minute per user
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MINUTES = 1;

// Stripe price IDs (from .lovable/plan.md)
const PRICES = {
  investor_basic: "price_1SjI8j0VL3B5XXLHB1xRD8Bb", // Investor Pro subscription ($49/month)
  investor_pro: "price_1SjI8j0VL3B5XXLHB1xRD8Bb",   // Investor Pro subscription ($49/month) - same price, single tier in Stripe
};

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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("ERROR: STRIPE_SECRET_KEY is not set");
      throw new Error("Stripe configuration error: Secret key missing");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("ERROR: No Authorization header");
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError) {
      logStep("ERROR: Auth verification failed", { error: userError.message });
      throw new Error(`Authentication error: ${userError.message}`);
    }

    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check rate limit
    const { data: rateLimitOk, error: rlError } = await supabaseAdmin.rpc("check_rate_limit", {
      p_user_id: user.id,
      p_function_name: "create-checkout",
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

    let priceType, quantity;
    try {
      const body = await req.json();
      priceType = body.priceType;
      quantity = body.quantity || 1;
    } catch (e) {
      logStep("ERROR: Failed to parse request body");
      throw new Error("Invalid request body");
    }

    const priceId = PRICES[priceType as keyof typeof PRICES];
    if (!priceId) {
      logStep("ERROR: Invalid price type", { priceType });
      throw new Error(`Invalid price type: ${priceType}`);
    }

    logStep("Processing checkout", { priceType, quantity, priceId });

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    const isSubscription = priceType === "investor_basic" || priceType === "investor_pro";

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity }],
      mode: isSubscription ? "subscription" : "payment",
      success_url: `${origin || "https://quickliqi.com"}/dashboard?payment=success`,
      cancel_url: `${origin || "https://quickliqi.com"}/pricing?payment=canceled`,
    };

    // Add 7-day trial for subscriptions
    if (isSubscription) {
      sessionConfig.subscription_data = {
        trial_period_days: 7,
      };
    }

    try {
      const session = await stripe.checkout.sessions.create(sessionConfig);
      logStep("Checkout session created", { sessionId: session.id, url: session.url });

      // Audit log
      await supabaseAdmin.from("financial_audit_log").insert({
        actor_id: user.id,
        action: "checkout_session_created",
        resource_type: "checkout_session",
        resource_id: session.id,
        details: { priceType, quantity, priceId },
      });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (stripeError: unknown) {
      const message = stripeError instanceof Error ? stripeError.message : String(stripeError);
      logStep("ERROR: Stripe session creation failed", { message });
      throw new Error(`Stripe error: ${message}`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
