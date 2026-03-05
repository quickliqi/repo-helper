import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests from your Vite frontend
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    
    // Securely forward the request to the AWS Swarm
    // Uses the Supabase Vault/Env variable for the secret key
    const swarmSecret = Deno.env.get('SWARM_SECRET_KEY') || 'QL_SWARM_SECURE_9A4b7X1v_LIVE'
    
    const swarmResponse = await fetch('http://54.213.177.197:8000', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-swarm-key': swarmSecret
      },
      body: JSON.stringify(payload)
    })

    const data = await swarmResponse.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})