import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  console.log(`[STRIPE-WEBHOOK] ${step}`, details ? JSON.stringify(details) : "");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    logStep("Received webhook", { hasSignature: !!signature });

    // Verify webhook signature
    if (!signature) {
      logStep("ERROR", { message: "Missing stripe-signature header" });
      return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (!webhookSecret) {
      logStep("ERROR", { message: "STRIPE_WEBHOOK_SECRET not configured" });
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logStep("Signature verification failed", { error: errorMessage });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Signature verified, processing event", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerEmail = session.customer_email || session.customer_details?.email;
        
        logStep("Checkout completed", { email: customerEmail, mode: session.mode });

        // Get user by email
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const user = users.users.find(u => u.email === customerEmail);
        
        if (!user) {
          logStep("User not found for email", { email: customerEmail });
          break;
        }

        if (session.mode === "subscription") {
          // Handle investor subscription
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          
          await supabaseAdmin.from("subscriptions").upsert({
            user_id: user.id,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            status: subscription.status === "trialing" ? "trialing" : "active",
            plan_type: "investor_pro",
            trial_ends_at: subscription.trial_end 
              ? new Date(subscription.trial_end * 1000).toISOString() 
              : null,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          }, { onConflict: "user_id" });

          logStep("Subscription created/updated", { userId: user.id, status: subscription.status });
        } else if (session.mode === "payment") {
          // Handle listing credit purchase
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
          const quantity = lineItems.data[0]?.quantity || 1;

          // Get or create listing credits record
          const { data: existingCredits } = await supabaseAdmin
            .from("listing_credits")
            .select("*")
            .eq("user_id", user.id)
            .single();

          if (existingCredits) {
            await supabaseAdmin
              .from("listing_credits")
              .update({ 
                credits_remaining: existingCredits.credits_remaining + quantity,
                stripe_customer_id: session.customer as string,
              })
              .eq("user_id", user.id);
          } else {
            await supabaseAdmin.from("listing_credits").insert({
              user_id: user.id,
              stripe_customer_id: session.customer as string,
              credits_remaining: quantity,
            });
          }

          // Record payment
          await supabaseAdmin.from("payment_history").insert({
            user_id: user.id,
            stripe_payment_intent_id: session.payment_intent as string,
            amount: session.amount_total || 0,
            currency: session.currency || "usd",
            description: `${quantity} listing credit(s)`,
            status: "succeeded",
          });

          logStep("Listing credits added", { userId: user.id, quantity });
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by stripe customer id
        const { data: subRecord } = await supabaseAdmin
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (subRecord) {
          await supabaseAdmin.from("subscriptions").update({
            status: subscription.status as any,
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          }).eq("user_id", subRecord.user_id);

          logStep("Subscription updated", { userId: subRecord.user_id, status: subscription.status });
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
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
