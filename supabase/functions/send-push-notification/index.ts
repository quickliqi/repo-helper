import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationPayload {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY');
    if (!FCM_SERVER_KEY) {
      console.error('FCM_SERVER_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Push notifications not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: PushNotificationPayload = await req.json();
    console.log('Received push notification request:', payload);

    const { user_id, title, body, data } = payload;

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's FCM token
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('user_id', user_id)
      .single();

    if (profileError || !profile?.fcm_token) {
      console.log('No FCM token found for user:', user_id);
      return new Response(
        JSON.stringify({ success: false, reason: 'No FCM token registered' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending FCM notification to token:', profile.fcm_token.substring(0, 20) + '...');

    // Send FCM notification
    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${FCM_SERVER_KEY}`
      },
      body: JSON.stringify({
        to: profile.fcm_token,
        notification: {
          title,
          body,
          sound: 'default',
          click_action: 'FCM_PLUGIN_ACTIVITY'
        },
        data: data || {},
        priority: 'high'
      })
    });

    const fcmResult = await fcmResponse.json();
    console.log('FCM response:', fcmResult);

    if (fcmResult.success === 1) {
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Check if token is invalid and remove it
      if (fcmResult.results?.[0]?.error === 'NotRegistered' || 
          fcmResult.results?.[0]?.error === 'InvalidRegistration') {
        console.log('Removing invalid FCM token for user:', user_id);
        await supabase
          .from('profiles')
          .update({ fcm_token: null })
          .eq('user_id', user_id);
      }

      return new Response(
        JSON.stringify({ success: false, error: fcmResult }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error sending push notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
