import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, sentry-trace, baggage",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
        );

        // Verify user
        const {
            data: { user },
            error: userError,
        } = await supabaseClient.auth.getUser();

        if (userError || !user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Use Service Role to access and modify credits (users only have SELECT access via RLS)
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Fetch user credits
        const { data: credits, error: creditsError } = await supabaseAdmin
            .from("user_contract_credits")
            .select("*")
            .eq("user_id", user.id)
            .single();

        if (creditsError && creditsError.code !== 'PGRST116') {
            console.error("Error fetching credits:", creditsError);
            return new Response(JSON.stringify({ error: "Failed to fetch credits" }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Handle missing credit row
        // (Should be created by trigger, but fail-safe)
        if (!credits) {
            return new Response(JSON.stringify({ error: "Credit record not found" }), {
                status: 404, // Or 402 if we consider no record as no credits? Warning: strict logic implies free 5.
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        let updated = false;

        // Credit deduction logic
        // 1. Check free credits
        if (credits.monthly_free_credits > 0) {
            const { error: updateError } = await supabaseAdmin
                .from("user_contract_credits")
                .update({ monthly_free_credits: credits.monthly_free_credits - 1 })
                .eq("user_id", user.id);

            if (updateError) throw updateError;
            updated = true;
        }
        // 2. Check purchased credits
        else if (credits.purchased_credits > 0) {
            const { error: updateError } = await supabaseAdmin
                .from("user_contract_credits")
                .update({ purchased_credits: credits.purchased_credits - 1 })
                .eq("user_id", user.id);

            if (updateError) throw updateError;
            updated = true;
        }

        // 3. Fallback: No credits
        if (!updated) {
            return new Response(JSON.stringify({ error: "Insufficient credits", code: "PAYMENT_REQUIRED" }), {
                status: 402,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Success response
        return new Response(
            JSON.stringify({
                success: true,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );

    } catch (error) {
        console.error("Unexpected error:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
