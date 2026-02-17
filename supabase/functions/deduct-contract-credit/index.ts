import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

        // Use Service Role to access and modify credits (users only have SELECT access)
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

        // Handle missing credit row (should be created by trigger, but fail-safe)
        let currentCredits = credits;
        if (!currentCredits) {
            // Optional: try to create it if it doesn't exist? 
            // For now, treat as 0 credits or error.
            // The requirement implies 5 free on signup.
            // Let's return error if not found to be safe.
            return new Response(JSON.stringify({ error: "Credit record not found" }), {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        let updated = false;

        // Credit deduction logic
        if (currentCredits.monthly_free_credits > 0) {
            const { error: updateError } = await supabaseAdmin
                .from("user_contract_credits")
                .update({ monthly_free_credits: currentCredits.monthly_free_credits - 1 })
                .eq("user_id", user.id);

            if (updateError) throw updateError;
            updated = true;
        } else if (currentCredits.purchased_credits > 0) {
            const { error: updateError } = await supabaseAdmin
                .from("user_contract_credits")
                .update({ purchased_credits: currentCredits.purchased_credits - 1 })
                .eq("user_id", user.id);

            if (updateError) throw updateError;
            updated = true;
        }

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
