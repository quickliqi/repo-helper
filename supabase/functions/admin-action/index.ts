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
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Authenticate User
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('No authorization header')
        }

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
            authHeader.replace('Bearer ', '')
        )

        if (userError || !user) {
            throw new Error('Invalid token')
        }

        // 2. Verify Admin Role
        const { data: roles, error: roleError } = await supabaseClient
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

        // 3. Handle Request
        const { action, payload } = await req.json()
        const ip = req.headers.get('x-forwarded-for') || 'unknown'

        console.log(`[Admin Action] User ${user.email} performing ${action} from ${ip}`)

        let result
        let detailsForLog = payload

        switch (action) {
            case 'toggle_feature_flag':
                // Payload: { key: string, is_enabled: boolean }
                const { key, is_enabled } = payload
                const { data: flagData, error: flagError } = await supabaseClient
                    .from('feature_flags')
                    .update({ is_enabled, updated_at: new Date().toISOString() })
                    .eq('key', key)
                    .select()
                    .single()

                if (flagError) throw flagError
                result = flagData
                break

            case 'update_platform_setting':
                // Payload: { key: string, value: any }
                const { key: settingKey, value } = payload
                // Verify type (basic check)
                const { data: currentSetting } = await supabaseClient
                    .from('platform_settings')
                    .select('type')
                    .eq('key', settingKey)
                    .single()

                // TODO: Strict type validation based on currentSetting.type

                const { data: settingData, error: settingError } = await supabaseClient
                    .from('platform_settings')
                    .update({ value, updated_at: new Date().toISOString() })
                    .eq('key', settingKey)
                    .select()
                    .single()

                if (settingError) throw settingError
                result = settingData
                break

            case 'impersonate_user':
                // Reserved for future implementation
                // Would likely involve generating a temporary JWT or session
                result = { message: "Impersonation logic placeholder" }
                break

            default:
                throw new Error(`Unknown action: ${action}`)
        }

        // 4. Log to Audit Trail
        await supabaseClient.from('admin_audit_logs').insert({
            admin_id: user.id,
            action: action,
            target_id: payload.key || payload.target_id || null, // Best effort to capture target
            details: detailsForLog,
            ip_address: ip
        })

        return new Response(
            JSON.stringify({ success: true, data: result }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error('Error processing admin action:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
