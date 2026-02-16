import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[BUY-LISTING-CREDITS] ${step}`, details ? JSON.stringify(details) : "");
};

// Rate limit: 10 requests per minute per user
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MINUTES = 1;

const LISTING_CREDIT_PRICE = "price_1SjI9J0VL3B5XXLH4pGYfKkC"; // $10 per credit

serve(async (req) => {
  const origin = req.headers.get("origin");

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
    const { data } = await supabaseAuth.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check rate limit
    const { data: rateLimitOk, error: rlError } = await supabaseAdmin.rpc("check_rate_limit", {
      p_user_id: user.id,
      p_function_name: "buy-listing-credits",
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

    const { quantity = 1 } = await req.json();
    logStep("Processing purchase", { quantity });

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-04-30.basil",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: LISTING_CREDIT_PRICE, quantity }],
      mode: "payment",
      success_url: `${origin || "https://realquickliqi.com"}/dashboard?credits=success`,
      cancel_url: `${origin || "https://realquickliqi.com"}/pricing?credits=canceled`,
    });

    logStep("Checkout session created", { sessionId: session.id });

    // Audit log
    await supabaseAdmin.from("financial_audit_log").insert({
      actor_id: user.id,
      action: "credits_checkout_created",
      resource_type: "checkout_session",
      resource_id: session.id,
      details: { quantity, priceId: LISTING_CREDIT_PRICE },
    });

    return new Response(JSON.stringify({ url: session.url }), {
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
