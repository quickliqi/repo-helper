import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
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

        const { templateType, clauses } = await req.json();

        if (!templateType || !Array.isArray(clauses)) {
            return new Response(JSON.stringify({ error: "Invalid request body" }), {
                status: 400,
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

        if (creditsError) {
            console.error("Error fetching credits:", creditsError);
            return new Response(JSON.stringify({ error: "Failed to fetch credits" }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (!credits) {
            return new Response(JSON.stringify({ error: "Credit record not found" }), {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Credit deduction logic
        if (credits.monthly_free_credits > 0) {
            const { error: updateError } = await supabaseAdmin
                .from("user_contract_credits")
                .update({ monthly_free_credits: credits.monthly_free_credits - 1 })
                .eq("user_id", user.id);

            if (updateError) {
                console.error("Error updating credits:", updateError);
                return new Response(JSON.stringify({ error: "Failed to update credits" }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
        } else if (credits.purchased_credits > 0) {
            const { error: updateError } = await supabaseAdmin
                .from("user_contract_credits")
                .update({ purchased_credits: credits.purchased_credits - 1 })
                .eq("user_id", user.id);

            if (updateError) {
                console.error("Error updating credits:", updateError);
                return new Response(JSON.stringify({ error: "Failed to update credits" }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
        } else {
            return new Response(JSON.stringify({ error: "Insufficient credits", code: "PAYMENT_REQUIRED" }), {
                status: 402,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Success response
        return new Response(
            JSON.stringify({
                success: true,
                message: "Contract authorized",
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
