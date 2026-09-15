// Edge Function: revenuecat-webhook (Architecture Section 7.6, 8 & 10)
// Public endpoint for RevenueCat webhook events (INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION).
// Updates rooms.is_pro and rooms.max_members to grant / revoke Pro entitlements.

import { corsHeaders } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabaseClient.ts';

interface RevenueCatEvent {
  type: 'INITIAL_PURCHASE' | 'RENEWAL' | 'CANCELLATION' | 'EXPIRATION' | string;
  app_user_id: string; // Supabase user id
  product_id: string;
  entitlement_ids?: string[];
  expiration_at_ms?: number;
  environment: 'SANDBOX' | 'PRODUCTION';
}

interface RevenueCatWebhookBody {
  api_version: string;
  event: RevenueCatEvent;
}

const PRO_MAX_MEMBERS = 99;
const FREE_MAX_MEMBERS = 4;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 1. Verify webhook secret authorization (Architecture Section 9.4)
  const webhookSecret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
  if (webhookSecret) {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${webhookSecret}`) {
      console.warn('Unauthorized RevenueCat webhook attempt');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    const body: RevenueCatWebhookBody = await req.json();
    const event = body.event;

    if (!event || !event.type || !event.app_user_id) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createAdminClient();
    const userId = event.app_user_id;

    console.log(`Received RevenueCat event ${event.type} for user ${userId}`);

    // 2. Identify the room for this user (where user is host or room_id is stored in room_members)
    const { data: memberRecord, error: memberError } = await supabase
      .from('room_members')
      .select('room_id, role')
      .eq('member_id', userId)
      .is('left_at', null)
      .order('role', { ascending: false }) // 'host' comes before 'member' if sorted or check host
      .limit(1)
      .maybeSingle();

    if (memberError || !memberRecord) {
      console.warn(`User ${userId} does not belong to any active room`);
      return new Response(
        JSON.stringify({ ok: true, message: `User ${userId} not attached to active room` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const roomId = memberRecord.room_id;

    // 3. Process subscription event types
    switch (event.type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL': {
        // Upgrade room to Pro
        const { error: upgradeError } = await supabase
          .from('rooms')
          .update({
            is_pro: true,
            max_members: PRO_MAX_MEMBERS,
          })
          .eq('id', roomId);

        if (upgradeError) {
          console.error(`Failed to upgrade room ${roomId} to Pro:`, upgradeError);
          throw upgradeError;
        }

        console.log(`Room ${roomId} successfully upgraded to Pro (max_members: ${PRO_MAX_MEMBERS})`);
        break;
      }

      case 'EXPIRATION': {
        // Downgrade room from Pro
        const { error: downgradeError } = await supabase
          .from('rooms')
          .update({
            is_pro: false,
            max_members: FREE_MAX_MEMBERS,
          })
          .eq('id', roomId);

        if (downgradeError) {
          console.error(`Failed to downgrade room ${roomId}:`, downgradeError);
          throw downgradeError;
        }

        console.log(`Room ${roomId} downgraded to Free tier (max_members: ${FREE_MAX_MEMBERS})`);
        break;
      }

      case 'CANCELLATION': {
        // Cancellation means user opted not to renew, but remains Pro until expiration_at_ms
        console.log(`Subscription cancelled for user ${userId}, Pro active until expiration`);
        break;
      }

      default: {
        console.log(`Unhandled event type ${event.type}`);
        break;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, event_type: event.type, room_id: roomId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('revenuecat-webhook fatal error:', errorMsg);
    return new Response(JSON.stringify({ ok: false, error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
