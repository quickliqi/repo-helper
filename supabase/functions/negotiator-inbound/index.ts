import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { property_id, buyerId, message_body } = await req.json()
    
    // Log the message for 40% commission enforcement
    const { error: logError } = await supabaseClient
      .from('secure_messages')
      .insert({
        deal_id: property_id,
        buyerId: buyerId,
        message: message_body,
        sender_type: 'buyer',
        timestamp: new Date().toISOString()
      })

    if (logError) throw logError

    // Trigger Negotiator Bot / Contract Generator
    const textUpper = message_body.toUpperCase();
    if (textUpper.includes('YES') || textUpper.includes('SEND CONTRACT')) {
      // 1. Log intent for QuickLiqi 40% commission enforcement
      await supabaseClient
        .from('deal_metrics')
        .update({ status: 'contract_requested', intent_logged: true })
        .eq('id', property_id)

      // 2. Dispatch to OpenClaw / LiqueFi Contract Generator webhook
      // (Webhook destination to be configured)
      console.log(`[Negotiator] Contract request triggered for Deal: ${property_id}`);
    }

    return new Response(
      JSON.stringify({ status: "success", received: message_body }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})
