import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SAVE-DEAL] ${step}${detailsStr}`);
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

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) throw new Error("User not authenticated");
    
    const userId = userData.user.id;
    logStep("User authenticated", { userId });

    const { scrape_result_id } = await req.json();
    if (!scrape_result_id) throw new Error("scrape_result_id is required");

    // Get the scrape result
    const { data: result, error: resultError } = await supabaseAdmin
      .from("scrape_results")
      .select("*")
      .eq("id", scrape_result_id)
      .eq("user_id", userId)
      .single();

    if (resultError || !result) {
      throw new Error("Scrape result not found");
    }

    if (result.is_saved) {
      throw new Error("Deal already saved");
    }

    // Mark as saved
    const { error: updateError } = await supabaseAdmin
      .from("scrape_results")
      .update({ is_saved: true })
      .eq("id", scrape_result_id);

    if (updateError) throw updateError;

    logStep("Deal saved successfully", { scrape_result_id });

    return new Response(JSON.stringify({
      success: true,
      message: "Deal saved to your collection"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
