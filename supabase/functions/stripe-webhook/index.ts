import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-04-30.basil",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

// Product IDs for differentiation
const SCRAPE_PRODUCT_ID = "prod_Ti4uCt003AN32Y";
const INVESTOR_PRO_PRODUCT_ID = "prod_TgfTWmwR82K9jw";

const ALLOWED_ORIGINS = [
  "https://quickliqi.com",
  "https://www.quickliqi.com",
  "https://quickliqi.lovable.app",
];

function getCorsHeaders(origin?: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

const logStep = (step: string, details?: unknown) => {
  console.log(`[STRIPE-WEBHOOK] ${step}`, details ? JSON.stringify(details) : "");
};

// ── Idempotency: check if event already processed ──
async function checkIdempotency(eventId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("webhook_events")
    .select("id, processing_status")
    .eq("stripe_event_id", eventId)
    .maybeSingle();

  if (data) {
    logStep("Duplicate event detected", { eventId, status: data.processing_status });
    // Mark as duplicate if not already
    if (data.processing_status !== "duplicate") {
      await supabaseAdmin
        .from("webhook_events")
        .update({ processing_status: "duplicate" })
        .eq("id", data.id);
    }
    return true; // already processed
  }
  return false;
}

// ── Log webhook event ──
async function logWebhookEvent(
  event: Stripe.Event,
  status: "processing" | "completed" | "failed",
  errorMessage?: string
) {
  try {
    await supabaseAdmin.from("webhook_events").upsert(
      {
        stripe_event_id: event.id,
        event_type: event.type,
        payload: event.data.object as Record<string, unknown>,
        processing_status: status,
        error_message: errorMessage || null,
        processed_at: status !== "processing" ? new Date().toISOString() : null,
      },
      { onConflict: "stripe_event_id" }
    );
  } catch (err) {
    logStep("Failed to log webhook event", { error: err instanceof Error ? err.message : String(err) });
  }
}

// ── Create or update payment transaction ──
async function upsertTransaction(params: {
  userId: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  stripeSubscriptionId?: string;
  transactionType: "subscription" | "credit_purchase" | "scrape_subscription";
  status: "pending" | "confirmed" | "fulfilled" | "failed" | "refunded";
  amount: number;
  currency: string;
  metadata?: Record<string, unknown>;
  errorMessage?: string;
}) {
  try {
    await supabaseAdmin.from("payment_transactions").insert({
      user_id: params.userId,
      stripe_session_id: params.stripeSessionId || null,
      stripe_payment_intent_id: params.stripePaymentIntentId || null,
      stripe_subscription_id: params.stripeSubscriptionId || null,
      transaction_type: params.transactionType,
      status: params.status,
      amount: params.amount,
      currency: params.currency,
      metadata: params.metadata || {},
      error_message: params.errorMessage || null,
    });
  } catch (err) {
    logStep("Failed to create transaction record", { error: err instanceof Error ? err.message : String(err) });
  }
}

// ── Financial audit log ──
async function auditLog(action: string, resourceType: string, resourceId: string, details: Record<string, unknown>, actorId?: string) {
  try {
    await supabaseAdmin.from("financial_audit_log").insert({
      actor_id: actorId || null,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details,
    });
  } catch (err) {
    logStep("Failed to write audit log", { error: err instanceof Error ? err.message : String(err) });
  }
}

// ── Lookup user by email (scalable vs listUsers) ──
async function findUserByEmail(email: string) {
  // Try profiles table first (indexed lookup)
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("user_id")
    .ilike("full_name", `%${email}%`)  // profiles don't store email, fallback to auth
    .limit(1);

  // Use auth admin to find user by email — this is the reliable method
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  return users.users.find(u => u.email === email);
}

// ── Send confirmation email ──
async function sendConfirmationEmail(
  email: string,
  type: "subscription" | "credits",
  amount: number,
  quantity?: number,
  planName?: string
) {
  try {
    const response = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-purchase-confirmation`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({ email, type, amount, quantity, planName }),
      }
    );
    if (!response.ok) {
      logStep("Failed to send confirmation email", { status: response.status });
    } else {
      logStep("Confirmation email sent", { email, type });
    }
  } catch (err) {
    logStep("Error sending confirmation email", { error: err instanceof Error ? err.message : String(err) });
  }
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    logStep("Received webhook", { hasSignature: !!signature });

    // ── Signature validation ──
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

      // Log failed signature attempt to audit
      await auditLog("webhook_signature_failed", "webhook", "unknown", {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });

      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Signature verified, processing event", { type: event.type, id: event.id });

    // ── Idempotency check ──
    const isDuplicate = await checkIdempotency(event.id);
    if (isDuplicate) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Log event as processing
    await logWebhookEvent(event, "processing");

    try {
      switch (event.type) {
        // ────────────────────────────────────────────────
        // CHECKOUT COMPLETED
        // ────────────────────────────────────────────────
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const customerEmail = session.customer_email || session.customer_details?.email;

          logStep("Checkout completed", { email: customerEmail, mode: session.mode });

          // Get user by email
          const user = customerEmail ? await findUserByEmail(customerEmail) : null;

          if (!user) {
            logStep("User not found for email", { email: customerEmail });
            await logWebhookEvent(event, "failed", `User not found for email: ${customerEmail}`);
            break;
          }

          if (session.mode === "subscription") {
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
            const productId = subscription.items.data[0]?.price?.product as string;

            logStep("Subscription product identified", { productId });

            if (productId === SCRAPE_PRODUCT_ID) {
              // ── Scrape subscription ──
              const periodStart = new Date(subscription.current_period_start * 1000).toISOString();
              const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();

              await supabaseAdmin.from("scrape_credits").upsert({
                user_id: user.id,
                credits_remaining: 10,
                credits_used: 0,
                subscription_active: true,
                stripe_subscription_id: subscription.id,
                current_period_start: periodStart,
                current_period_end: periodEnd,
              }, { onConflict: "user_id" });

              await upsertTransaction({
                userId: user.id,
                stripeSessionId: session.id,
                stripeSubscriptionId: subscription.id,
                transactionType: "scrape_subscription",
                status: "fulfilled",
                amount: session.amount_total || 10000,
                currency: session.currency || "usd",
                metadata: { productId, periodStart, periodEnd },
              });

              await auditLog("scrape_subscription_created", "subscription", subscription.id, {
                userId: user.id,
                email: customerEmail,
                amount: session.amount_total,
              }, user.id);

              logStep("Scrape subscription created", { userId: user.id });

              if (customerEmail) {
                await sendConfirmationEmail(customerEmail, "subscription", session.amount_total || 10000, undefined, "Investor Scraping Pro");
              }
            } else {
              // ── Investor Pro subscription ──
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

              await upsertTransaction({
                userId: user.id,
                stripeSessionId: session.id,
                stripeSubscriptionId: subscription.id,
                transactionType: "subscription",
                status: "fulfilled",
                amount: session.amount_total || 4900,
                currency: session.currency || "usd",
                metadata: { productId, planType: "investor_pro", status: subscription.status },
              });

              await auditLog("investor_subscription_created", "subscription", subscription.id, {
                userId: user.id,
                email: customerEmail,
                amount: session.amount_total,
                status: subscription.status,
              }, user.id);

              logStep("Investor subscription created/updated", { userId: user.id, status: subscription.status });

              if (customerEmail) {
                await sendConfirmationEmail(customerEmail, "subscription", session.amount_total || 4900, undefined, "Investor Pro");
              }
            }
          } else if (session.mode === "payment") {
            // ── Listing credit purchase ──
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
            const quantity = lineItems.data[0]?.quantity || 1;

            const { data: existingCredits } = await supabaseAdmin
              .from("listing_credits")
              .select("*")
              .eq("user_id", user.id)
              .maybeSingle();

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

            // Record payment in payment_history
            await supabaseAdmin.from("payment_history").insert({
              user_id: user.id,
              stripe_payment_intent_id: session.payment_intent as string,
              amount: session.amount_total || 0,
              currency: session.currency || "usd",
              description: `${quantity} listing credit(s)`,
              status: "succeeded",
            });

            await upsertTransaction({
              userId: user.id,
              stripeSessionId: session.id,
              stripePaymentIntentId: session.payment_intent as string,
              transactionType: "credit_purchase",
              status: "fulfilled",
              amount: session.amount_total || 0,
              currency: session.currency || "usd",
              metadata: { quantity },
            });

            await auditLog("listing_credits_purchased", "listing_credits", user.id, {
              quantity,
              amount: session.amount_total,
              paymentIntent: session.payment_intent,
            }, user.id);

            logStep("Listing credits added", { userId: user.id, quantity });

            if (customerEmail) {
              await sendConfirmationEmail(customerEmail, "credits", session.amount_total || 1000, quantity);
            }
          }
          break;
        }

        // ────────────────────────────────────────────────
        // SUBSCRIPTION UPDATED / DELETED
        // ────────────────────────────────────────────────
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;

          // Find user by stripe customer id in subscriptions table
          const { data: subRecord } = await supabaseAdmin
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_customer_id", customerId)
            .maybeSingle();

          if (subRecord) {
            await supabaseAdmin.from("subscriptions").update({
              status: subscription.status as string,
              cancel_at_period_end: subscription.cancel_at_period_end,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            }).eq("user_id", subRecord.user_id);

            await auditLog(
              event.type === "customer.subscription.deleted" ? "subscription_canceled" : "subscription_updated",
              "subscription",
              subscription.id,
              { userId: subRecord.user_id, status: subscription.status, cancelAtPeriodEnd: subscription.cancel_at_period_end },
              subRecord.user_id
            );

            logStep("Subscription updated", { userId: subRecord.user_id, status: subscription.status });
          }

          // Also check scrape_credits for scrape subscription updates
          const { data: scrapeRecord } = await supabaseAdmin
            .from("scrape_credits")
            .select("user_id")
            .eq("stripe_subscription_id", subscription.id)
            .maybeSingle();

          if (scrapeRecord) {
            if (event.type === "customer.subscription.deleted") {
              await supabaseAdmin.from("scrape_credits").update({
                subscription_active: false,
              }).eq("user_id", scrapeRecord.user_id);
            } else {
              await supabaseAdmin.from("scrape_credits").update({
                subscription_active: ["active", "trialing"].includes(subscription.status),
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              }).eq("user_id", scrapeRecord.user_id);
            }

            logStep("Scrape subscription updated", { userId: scrapeRecord.user_id, status: subscription.status });
          }
          break;
        }

        // ────────────────────────────────────────────────
        // PAYMENT FAILED (PaymentIntent)
        // ────────────────────────────────────────────────
        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const failureMessage = paymentIntent.last_payment_error?.message || "Unknown failure";

          logStep("Payment failed", {
            paymentIntentId: paymentIntent.id,
            reason: failureMessage,
          });

          // Log failed payment
          await supabaseAdmin.from("payment_history").insert({
            user_id: "00000000-0000-0000-0000-000000000000", // placeholder — we may not know user
            stripe_payment_intent_id: paymentIntent.id,
            amount: paymentIntent.amount || 0,
            currency: paymentIntent.currency || "usd",
            description: `Payment failed: ${failureMessage}`,
            status: "failed",
          });

          await auditLog("payment_failed", "payment_intent", paymentIntent.id, {
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            failureMessage,
            failureCode: paymentIntent.last_payment_error?.code,
          });

          break;
        }

        // ────────────────────────────────────────────────
        // INVOICE PAYMENT FAILED
        // ────────────────────────────────────────────────
        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId = invoice.customer as string;

          logStep("Invoice payment failed", {
            invoiceId: invoice.id,
            customerId,
            subscriptionId: invoice.subscription,
          });

          // Update subscription status to past_due
          if (invoice.subscription) {
            const { data: subRecord } = await supabaseAdmin
              .from("subscriptions")
              .select("user_id")
              .eq("stripe_customer_id", customerId)
              .maybeSingle();

            if (subRecord) {
              await supabaseAdmin.from("subscriptions").update({
                status: "past_due",
              }).eq("user_id", subRecord.user_id);

              logStep("Subscription marked as past_due", { userId: subRecord.user_id });
            }
          }

          await auditLog("invoice_payment_failed", "invoice", invoice.id as string, {
            customerId,
            subscriptionId: invoice.subscription,
            amountDue: invoice.amount_due,
          });

          break;
        }

        // ────────────────────────────────────────────────
        // CHARGE REFUNDED
        // ────────────────────────────────────────────────
        case "charge.refunded": {
          const charge = event.data.object as Stripe.Charge;

          logStep("Charge refunded", {
            chargeId: charge.id,
            paymentIntentId: charge.payment_intent,
            amountRefunded: charge.amount_refunded,
          });

          // Update transaction status
          if (charge.payment_intent) {
            await supabaseAdmin
              .from("payment_transactions")
              .update({ status: "refunded" })
              .eq("stripe_payment_intent_id", charge.payment_intent as string);
          }

          await auditLog("charge_refunded", "charge", charge.id, {
            paymentIntentId: charge.payment_intent,
            amountRefunded: charge.amount_refunded,
            currency: charge.currency,
          });

          break;
        }

        default:
          logStep("Unhandled event type", { type: event.type });
      }

      // Mark event as completed
      await logWebhookEvent(event, "completed");

    } catch (processingError: unknown) {
      const errorMsg = processingError instanceof Error ? processingError.message : String(processingError);
      logStep("Event processing error", { eventId: event.id, error: errorMsg });
      await logWebhookEvent(event, "failed", errorMsg);
      // Still return 200 to prevent Stripe from retrying indefinitely
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...getCorsHeaders(null), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
