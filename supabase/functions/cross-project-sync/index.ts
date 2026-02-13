import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cross-project-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[CROSS-PROJECT-SYNC] ${step}`, details ? JSON.stringify(details) : "");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Basic health check (useful for quickly verifying reachability)
    if (req.method === "GET") {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate cross-project API key
    // Supports either:
    //  - x-cross-project-key: <secret>
    //  - Authorization: Bearer <secret>
    const headerKey = req.headers.get("x-cross-project-key");
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    const bearerKey = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
    const providedKey = headerKey ?? bearerKey;

    // Prefer QUICKLIQI_API_SECRET (new name), but keep backward compatibility
    const expectedKey = Deno.env.get("QUICKLIQI_API_SECRET") ?? Deno.env.get("CROSS_PROJECT_API_KEY");

    if (!expectedKey) {
      throw new Error("CROSS_PROJECT_API_KEY not configured");
    }

    if (!providedKey || providedKey !== expectedKey) {
      logStep("Invalid API key", {
        headerPresent: Boolean(providedKey),
        headerLength: providedKey?.length ?? 0,
        source: headerKey ? "x-cross-project-key" : bearerKey ? "authorization_bearer" : "none",
      });
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body ONCE (the body stream can only be read once)
    let payload: Record<string, unknown>;
    try {
      payload = await req.json() as Record<string, unknown>;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logStep("Invalid JSON body", { message: msg });
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const action = payload?.action;
    const email = payload?.email;
    const user_id = payload?.user_id;
    logStep("Request received", {
      action,
      hasEmail: Boolean(email),
      hasUserId: Boolean(user_id),
      payloadKeys: payload && typeof payload === "object" ? Object.keys(payload).slice(0, 12) : [],
    });

    switch (action) {
      case "verify_user": {
        // Check if user exists and get their data
        if (!email) {
          throw new Error("Email is required for verify_user");
        }

        // Look up user by email in auth.users
        const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

        if (authError) {
          throw new Error(`Auth lookup failed: ${authError.message}`);
        }

        const user = authUsers.users.find(u => u.email === email);

        if (!user) {
          return new Response(JSON.stringify({
            exists: false,
            message: "User not found in QuickLiqi"
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get profile data
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        // Get role
        const { data: roleData } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        // Get subscription status
        const { data: subscription } = await supabaseAdmin
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        logStep("User found", { userId: user.id, role: roleData?.role });

        return new Response(JSON.stringify({
          exists: true,
          user_id: user.id,
          email: user.email,
          profile: profile ? {
            full_name: profile.full_name,
            company_name: profile.company_name,
            phone: profile.phone,
            city: profile.city,
            state: profile.state,
            is_verified: profile.is_verified,
            avatar_url: profile.avatar_url,
          } : null,
          role: roleData?.role || null,
          subscription: subscription ? {
            status: subscription.status,
            plan_type: subscription.plan_type,
            trial_ends_at: subscription.trial_ends_at,
            current_period_end: subscription.current_period_end,
          } : null,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_user_data": {
        // Get full user data by user_id
        if (!user_id) {
          throw new Error("user_id is required for get_user_data");
        }

        // Get profile
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("*")
          .eq("user_id", user_id)
          .maybeSingle();

        // Get buy boxes
        const { data: buyBoxes } = await supabaseAdmin
          .from("buy_boxes")
          .select("*")
          .eq("user_id", user_id);

        // Get properties (listings)
        const { data: properties } = await supabaseAdmin
          .from("properties")
          .select("*")
          .eq("user_id", user_id);

        // Get matches
        const { data: matches } = await supabaseAdmin
          .from("matches")
          .select("*, property:properties(*)")
          .eq("investor_id", user_id);

        // Get subscription
        const { data: subscription } = await supabaseAdmin
          .from("subscriptions")
          .select("*")
          .eq("user_id", user_id)
          .maybeSingle();

        // Get credits
        const { data: listingCredits } = await supabaseAdmin
          .from("listing_credits")
          .select("*")
          .eq("user_id", user_id)
          .maybeSingle();

        const { data: scrapeCredits } = await supabaseAdmin
          .from("scrape_credits")
          .select("*")
          .eq("user_id", user_id)
          .maybeSingle();

        logStep("User data retrieved", {
          userId: user_id,
          buyBoxCount: buyBoxes?.length,
          propertyCount: properties?.length
        });

        return new Response(JSON.stringify({
          profile,
          buy_boxes: buyBoxes || [],
          properties: properties || [],
          matches: matches || [],
          subscription,
          listing_credits: listingCredits,
          scrape_credits: scrapeCredits,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "sync_from_external": {
        // Allow the other project to push updates to QuickLiqi
        if (!user_id) {
          throw new Error("user_id is required for sync_from_external");
        }

        // Accept multiple common shapes from external callers
        const syncData =
          payload?.data ?? payload?.syncData ?? payload?.sync_data ?? payload?.payload ?? null;
        logStep("Sync payload", {
          userId: user_id,
          hasSyncData: Boolean(syncData),
          syncKeys:
            syncData && typeof syncData === "object" ? Object.keys(syncData).slice(0, 12) : [],
        });

        // Update profile if provided
        if (syncData?.profile) {
          await supabaseAdmin
            .from("profiles")
            .update({
              ...syncData.profile,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user_id);
        }

        logStep("Sync completed", { userId: user_id });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({
          error: "Invalid action. Supported: verify_user, get_user_data, sync_from_external"
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
