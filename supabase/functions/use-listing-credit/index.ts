import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[USE-LISTING-CREDIT] ${step}`, details ? JSON.stringify(details) : "");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    
    logStep("User authenticated", { userId: user.id });

    // Get current credits
    const { data: credits, error: creditsError } = await supabaseAdmin
      .from("listing_credits")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (creditsError) {
      throw new Error(`Error fetching credits: ${creditsError.message}`);
    }

    if (!credits || credits.credits_remaining < 1) {
      logStep("Insufficient credits", { userId: user.id, credits: credits?.credits_remaining || 0 });
      return new Response(
        JSON.stringify({ success: false, error: "Insufficient listing credits" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Deduct one credit
    const { error: updateError } = await supabaseAdmin
      .from("listing_credits")
      .update({
        credits_remaining: credits.credits_remaining - 1,
        credits_used: credits.credits_used + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      throw new Error(`Error updating credits: ${updateError.message}`);
    }

    logStep("Credit deducted", { 
      userId: user.id, 
      previousCredits: credits.credits_remaining,
      newCredits: credits.credits_remaining - 1
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        credits_remaining: credits.credits_remaining - 1 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
