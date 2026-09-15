// Edge Function: send-push (Architecture Section 8 & 9.2)
// Input: { recipient_id: string, title?: string, body: string, data?: Record<string, unknown> }

import { corsHeaders } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabaseClient.ts';
import { sendExpoPushNotification, isExpoPushToken } from '../_shared/expoPush.ts';

interface SendPushPayload {
  recipient_id: string;
  title?: string;
  body: string;
  data?: Record<string, unknown>;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload: SendPushPayload = await req.json();
    const { recipient_id, title = 'Due Bro', body, data } = payload;

    if (!recipient_id || !body) {
      return new Response(JSON.stringify({ ok: false, error: 'recipient_id and body are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createAdminClient();

    // Query recipient push token
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, push_token')
      .eq('id', recipient_id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ ok: false, error: `Recipient profile not found: ${profileError?.message || ''}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile.push_token) {
      return new Response(
        JSON.stringify({ ok: false, skipped: true, message: 'Recipient has no push_token registered' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isExpoPushToken(profile.push_token)) {
      return new Response(
        JSON.stringify({ ok: false, error: `Invalid push_token format: ${profile.push_token}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send push notification via Expo Push API
    const pushResult = await sendExpoPushNotification({
      to: profile.push_token,
      title,
      body,
      data,
    });

    // If DeviceNotRegistered, cleanup stale push token in profile
    if (!pushResult.success && pushResult.ticket?.details?.error === 'DeviceNotRegistered') {
      console.warn(`DeviceNotRegistered for user ${recipient_id}, clearing stale push_token`);
      await supabase.from('profiles').update({ push_token: null }).eq('id', recipient_id);
    }

    if (!pushResult.success) {
      return new Response(
        JSON.stringify({ ok: false, error: pushResult.error, ticket: pushResult.ticket }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, ticket: pushResult.ticket }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('send-push unexpected error:', errorMsg);
    return new Response(JSON.stringify({ ok: false, error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
