import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        // 1. Initialize Supabase Client with Service Role Key (for Admin Operations)
        // We use the Service Role key to bypass RLS when fetching/updating credits
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 2. Authenticate the Requesting User
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('No authorization header')
        }

        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
            authHeader.replace('Bearer ', '')
        )

        if (userError || !user) {
            throw new Error('Invalid token')
        }

        // 3. Verify Admin Privileges
        // Check the user_roles table to see if the authenticated user is an admin
        const { data: roles, error: roleError } = await supabaseAdmin
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin')
            .single()

        if (roleError || !roles) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized: Admin access required' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
            )
        }

        // 4. Handle Actions
        const { action, payload } = await req.json()

        if (action === 'fetch') {
            // Fetch all credit records
            const { data: credits, error: creditsError } = await supabaseAdmin
                .from('user_contract_credits')
                .select('*')

            if (creditsError) throw creditsError

            // Fetch users to map emails (User Management API)
            // Note: listUsers has a default limit (50). We'll set a higher page size.
            // For a scalable solution, this should be paginated, but for now we fetch a large batch.
            const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
                page: 1,
                perPage: 1000
            })

            if (usersError) throw usersError

            // Map emails to credit records
            const combinedData = credits.map(credit => {
                const userDetails = users.find(u => u.id === credit.user_id)
                return {
                    ...credit,
                    email: userDetails?.email || 'Unknown',
                    last_sign_in: userDetails?.last_sign_in_at
                }
            })

            return new Response(
                JSON.stringify({ data: combinedData }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (action === 'update') {
            const { target_user_id, monthly_free_credits, purchased_credits } = payload

            if (!target_user_id) {
                throw new Error('Missing target_user_id')
            }

            const updates: any = {}
            if (typeof monthly_free_credits === 'number') updates.monthly_free_credits = monthly_free_credits
            if (typeof purchased_credits === 'number') updates.purchased_credits = purchased_credits

            // Update last reset date if needed? No, usually that's automated or specific action. 
            // We only update the credits counts as requested.

            const { data, error } = await supabaseAdmin
                .from('user_contract_credits')
                .update(updates)
                .eq('user_id', target_user_id)
                .select()
                .single()

            if (error) throw error

            return new Response(
                JSON.stringify({ data }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        throw new Error(`Unknown action: ${action}`)

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
