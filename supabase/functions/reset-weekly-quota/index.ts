// Edge Function: reset-weekly-quota (Architecture Section 6.7 & 8)
// Triggered by pg_cron every Monday at 00:00.
// Generates weekly_quota_targets for all active members for the new week (default 60 pts, 30 pts for rookies).
// Does NOT delete or reset point_ledger (append-only ledger auto-resets by grouping by week_start).

import { corsHeaders } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabaseClient.ts';

const DEFAULT_WEEKLY_QUOTA_POINTS = 60;
const ROOKIE_DISCOUNT_PERCENT = 0.5; // 50% discount for new members (Architecture Section 6.10)

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createAdminClient();
    const now = new Date();

    // Determine current week's Monday
    const currentMonday = new Date(now);
    const day = currentMonday.getDay();
    const diff = currentMonday.getDate() - day + (day === 0 ? -6 : 1);
    currentMonday.setDate(diff);
    const weekStartStr = currentMonday.toISOString().split('T')[0];

    // Fetch all active room members
    const { data: members, error: membersError } = await supabase
      .from('room_members')
      .select('room_id, member_id, is_new_member_until')
      .is('left_at', null);

    if (membersError) {
      console.error('Error fetching room members for weekly reset:', membersError);
      throw membersError;
    }

    if (!members || members.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, message: 'No active members found', week_start: weekStartStr, count: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const nowTime = now.getTime();
    const targetsToUpsert = members.map((m) => {
      const isRookie = m.is_new_member_until ? new Date(m.is_new_member_until).getTime() > nowTime : false;
      const targetPoints = isRookie
        ? Math.round(DEFAULT_WEEKLY_QUOTA_POINTS * ROOKIE_DISCOUNT_PERCENT)
        : DEFAULT_WEEKLY_QUOTA_POINTS;

      return {
        room_id: m.room_id,
        member_id: m.member_id,
        week_start: weekStartStr,
        target_points: targetPoints,
      };
    });

    // Upsert into weekly_quota_targets (idempotent: on conflict do update)
    const { error: upsertError } = await supabase
      .from('weekly_quota_targets')
      .upsert(targetsToUpsert, { onConflict: 'room_id,member_id,week_start' });

    if (upsertError) {
      console.error('Error upserting weekly_quota_targets:', upsertError);
      throw upsertError;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        week_start: weekStartStr,
        targets_created_or_updated: targetsToUpsert.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('reset-weekly-quota fatal error:', errorMsg);
    return new Response(JSON.stringify({ ok: false, error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
