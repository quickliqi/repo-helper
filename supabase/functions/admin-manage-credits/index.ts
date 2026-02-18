import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // 1. Initialize Supabase Client with Service Role Key (for Admin Operations)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // 2. Authenticate the Requesting User
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('No authorization header');
        }

        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
            authHeader.replace('Bearer ', '')
        );

        if (userError || !user) {
            throw new Error('Invalid token');
        }

        // 3. Verify Admin Privileges
        const { data: roles, error: roleError } = await supabaseAdmin
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin')
            .single();

        if (roleError || !roles) {
            console.error('Admin verification failed for user:', user.id);
            return new Response(
                JSON.stringify({ error: 'Unauthorized: Admin access required' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
            );
        }

        // 4. Handle Actions
        const { action, payload } = await req.json();

        if (action === 'fetch') {
            console.log('Fetching all user credits');

            // Query user_contract_credits
            const { data: credits, error: creditsError } = await supabaseAdmin
                .from('user_contract_credits')
                .select('*');

            if (creditsError) throw creditsError;

            // Fetch users to map emails
            const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
                page: 1,
                perPage: 1000
            });

            if (usersError) throw usersError;

            // Map emails to credits
            const combinedData = credits.map(credit => {
                const userDetails = users.find(u => u.id === credit.user_id);
                return {
                    ...credit,
                    email: userDetails?.email || 'Unknown',
                    last_sign_in: userDetails?.last_sign_in_at
                };
            });

            return new Response(
                JSON.stringify({ data: combinedData }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (action === 'update') {
            const { target_user_id, monthly_free_credits, purchased_credits } = payload;

            console.log(`Updating credits for user: ${target_user_id}`, payload);

            if (!target_user_id) {
                throw new Error('Missing target_user_id');
            }

            const updates: any = {};
            if (typeof monthly_free_credits === 'number') updates.monthly_free_credits = monthly_free_credits;
            if (typeof purchased_credits === 'number') updates.purchased_credits = purchased_credits;

            const { data, error } = await supabaseAdmin
                .from('user_contract_credits')
                .update(updates)
                .eq('user_id', target_user_id)
                .select()
                .single();

            if (error) throw error;

            return new Response(
                JSON.stringify({ data }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        throw new Error(`Unknown action: ${action}`);

    } catch (error: any) {
        console.error('Error in admin-manage-credits:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});
