import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CONVERT-TO-LISTING] ${step}${detailsStr}`);
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) throw new Error("User not authenticated");

    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // Check if user has wholesaler role (required to post listings)
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleError || !roleData) {
      throw new Error("Could not verify user role");
    }

    // Allow investors to convert deals (they become the wholesaler for this listing)
    logStep("User role verified", { role: roleData.role });

    const { scrape_result_id, overrides } = await req.json();
    
    if (!scrape_result_id) {
      throw new Error("scrape_result_id is required");
    }

    logStep("Converting scrape result", { scrape_result_id });

    // Get the scraped deal
    const { data: scrapeResult, error: scrapeError } = await supabaseAdmin
      .from("scrape_results")
      .select("*")
      .eq("id", scrape_result_id)
      .eq("user_id", user.id)
      .single();

    if (scrapeError || !scrapeResult) {
      throw new Error("Scrape result not found or access denied");
    }

    if (!scrapeResult.is_saved) {
      throw new Error("Only saved deals can be converted to listings");
    }

    logStep("Scrape result found", { id: scrapeResult.id });

    // Parse extracted data
    const extractedData = scrapeResult.extracted_data as any || {};
    
    // Build property data with overrides support
    const propertyData = {
      user_id: user.id,
      title: overrides?.title || extractedData.title || `${extractedData.bedrooms || 3} Bed Home in ${extractedData.city || 'Unknown'}`,
      address: overrides?.address || extractedData.address || "Address TBD",
      city: overrides?.city || extractedData.city || "Unknown",
      state: overrides?.state || extractedData.state || "Unknown",
      zip_code: overrides?.zip_code || extractedData.zip_code || "00000",
      asking_price: overrides?.asking_price || extractedData.asking_price || 0,
      arv: overrides?.arv || extractedData.arv || null,
      repair_estimate: overrides?.repair_estimate || extractedData.repair_estimate || null,
      bedrooms: overrides?.bedrooms || extractedData.bedrooms || null,
      bathrooms: overrides?.bathrooms || extractedData.bathrooms || null,
      sqft: overrides?.sqft || extractedData.sqft || null,
      property_type: overrides?.property_type || extractedData.property_type || "single_family",
      deal_type: overrides?.deal_type || extractedData.deal_type || "wholesale",
      condition: overrides?.condition || extractedData.condition || "fair",
      description: overrides?.description || extractedData.description || scrapeResult.analysis_notes || "",
      equity_percentage: overrides?.equity_percentage || extractedData.equity_percentage || null,
      status: "active" as const,
      highlights: overrides?.highlights || ["Sourced from Facebook", "AI-Analyzed Deal"],
    };

    logStep("Property data prepared", { title: propertyData.title, city: propertyData.city });

    // Check if user has listing credits (for wholesalers) or handle differently
    const { data: credits } = await supabaseAdmin
      .from("listing_credits")
      .select("credits_remaining")
      .eq("user_id", user.id)
      .single();

    if (!credits || credits.credits_remaining <= 0) {
      throw new Error("No listing credits available. Purchase credits to post listings.");
    }

    // Insert the property
    const { data: newProperty, error: insertError } = await supabaseAdmin
      .from("properties")
      .insert(propertyData)
      .select()
      .single();

    if (insertError) {
      logStep("Insert error", { error: insertError.message });
      throw new Error(`Failed to create listing: ${insertError.message}`);
    }

    logStep("Property created", { propertyId: newProperty.id });

    // Deduct listing credit
    await supabaseAdmin
      .from("listing_credits")
      .update({
        credits_remaining: credits.credits_remaining - 1,
        credits_used: (credits as any).credits_used + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    logStep("Listing credit deducted");

    // Update scrape result to mark as converted (we can add a field for this)
    // For now, we'll just return success

    return new Response(JSON.stringify({
      success: true,
      property_id: newProperty.id,
      message: "Deal successfully converted to marketplace listing",
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
