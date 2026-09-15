// Edge Function: auto-assign-task (Architecture Section 5.4, 6.3 & 8)
// Triggered by pg_cron every 15 minutes.
// Fallback allocation at T-12h: assigns open tasks to top-ranked candidates via Rule-based (Tier 1) or ML Service.

import { corsHeaders } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabaseClient.ts';
import { rankCandidatesRuleBased, MemberCandidateFeature } from '../_shared/fairnessScorer.ts';
import { sendExpoPushNotification } from '../_shared/expoPush.ts';

interface TaskToAssign {
  id: string;
  room_id: string;
  title: string;
  effort_points: number;
  due_at: string;
}

interface RankedCandidate {
  member_id: string;
  score: number;
  rank: number;
}

const ML_REQUEST_TIMEOUT_MS = 2000;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createAdminClient();
    const now = new Date();
    const tMinus12h = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours from now

    // 1. Query open tasks where due_at is within the next 12 hours (or overdue)
    const { data: tasks, error: taskError } = await supabase
      .from('task_instances')
      .select('id, room_id, title, effort_points, due_at')
      .eq('status', 'open')
      .lte('due_at', tMinus12h.toISOString())
      .order('due_at', { ascending: true });

    if (taskError) {
      console.error('Error querying tasks for auto-assign:', taskError);
      throw taskError;
    }

    let assignedCount = 0;
    const currentWeekStart = new Date();
    // Monday of current week
    const day = currentWeekStart.getDay();
    const diff = currentWeekStart.getDate() - day + (day === 0 ? -6 : 1);
    currentWeekStart.setDate(diff);
    const weekStartStr = currentWeekStart.toISOString().split('T')[0];

    for (const task of (tasks as TaskToAssign[] || [])) {
      // 2. Fetch candidates in the room who are active and not away
      const { data: activeMembers } = await supabase
        .from('room_members')
        .select('member_id, is_new_member_until')
        .eq('room_id', task.room_id)
        .is('left_at', null)
        .eq('away_status', 'active');

      if (!activeMembers || activeMembers.length === 0) {
        continue;
      }

      // Check weekly quota progress for active members
      const memberIds = activeMembers.map((m) => m.member_id);
      const { data: quotaProgress } = await supabase
        .from('weekly_quota_progress')
        .select('member_id, achieved_points')
        .eq('room_id', task.room_id)
        .eq('week_start', weekStartStr)
        .in('member_id', memberIds);

      const { data: quotaTargets } = await supabase
        .from('weekly_quota_targets')
        .select('member_id, target_points')
        .eq('room_id', task.room_id)
        .eq('week_start', weekStartStr)
        .in('member_id', memberIds);

      const progressMap = new Map((quotaProgress || []).map((p) => [p.member_id, p.achieved_points]));
      const targetMap = new Map((quotaTargets || []).map((t) => [t.member_id, t.target_points || 60]));

      // Filter out members who already achieved quota
      let eligibleMemberIds = activeMembers
        .filter((m) => {
          const achieved = progressMap.get(m.member_id) || 0;
          const target = targetMap.get(m.member_id) || 60;
          return achieved < target;
        })
        .map((m) => m.member_id);

      // If all members reached quota, fallback to all active members (pure round-robin)
      if (eligibleMemberIds.length === 0) {
        eligibleMemberIds = memberIds;
      }

      // 3. Fetch mv_member_features for candidates
      const { data: memberFeatures } = await supabase
        .from('mv_member_features')
        .select('*')
        .eq('room_id', task.room_id)
        .in('member_id', eligibleMemberIds);

      const featureMap = new Map((memberFeatures || []).map((f) => [f.member_id, f]));

      const candidates: MemberCandidateFeature[] = eligibleMemberIds.map((id) => {
        const feat = featureMap.get(id);
        const rookieUntil = activeMembers.find((m) => m.member_id === id)?.is_new_member_until || null;

        return {
          member_id: id,
          room_id: task.room_id,
          quota_progress_pct: feat?.quota_progress_pct ?? null,
          completion_rate: feat?.completion_rate ?? null,
          avg_delay_hours: feat?.avg_delay_hours ?? null,
          total_karma: feat?.total_karma ?? null,
          away_status: 'active',
          is_new_member_until: rookieUntil,
          tenure_days: feat?.tenure_days ?? 0,
        };
      });

      // 4. Rank candidates: Check ML Service or fallback to Tier 1 Rule-based
      const useMl = Deno.env.get('USE_ML_RANKER') === 'true';
      const mlServiceUrl = Deno.env.get('ML_SERVICE_URL');

      let rankedList: RankedCandidate[] = [];
      let modelVersion = 'rule_v1';
      let assignmentMethod = 'auto_round_robin';

      if (useMl && mlServiceUrl) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), ML_REQUEST_TIMEOUT_MS);

          const mlResp = await fetch(`${mlServiceUrl}/rank-candidates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              room_id: task.room_id,
              task_id: task.id,
              candidates: eligibleMemberIds,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (mlResp.ok) {
            const mlData = await mlResp.json();
            if (Array.isArray(mlData.ranking) && mlData.ranking.length > 0) {
              rankedList = mlData.ranking.map((item: { user_id: string; score: number }, idx: number) => ({
                member_id: item.user_id,
                score: item.score,
                rank: idx + 1,
              }));
              modelVersion = mlData.model_version || 'lgbm_service';
              assignmentMethod = 'auto_ml';
            }
          }
        } catch (mlErr) {
          console.warn(`ML Service ranking failed/timed out for task ${task.id}, falling back to rule_v1:`, mlErr);
        }
      }

      // Fallback to Rule-based if ML did not provide ranking
      if (rankedList.length === 0) {
        const scoredResults = rankCandidatesRuleBased(candidates, task.effort_points);
        rankedList = scoredResults.map((res, idx) => ({
          member_id: res.member_id,
          score: res.score,
          rank: idx + 1,
        }));
        modelVersion = 'rule_v1';
        assignmentMethod = 'auto_round_robin';
      }

      if (rankedList.length === 0) {
        continue;
      }

      const topCandidate = rankedList[0];

      // 5. Log all predictions for audit and retraining
      const predictionsPayload = rankedList.map((c) => ({
        task_id: task.id,
        candidate_member_id: c.member_id,
        score: c.score,
        rank: c.rank,
        model_version: modelVersion,
      }));
      await supabase.from('ml_predictions').insert(predictionsPayload);

      // 6. Update task_instance
      const { error: assignError } = await supabase
        .from('task_instances')
        .update({
          claimed_by: topCandidate.member_id,
          claimed_at: now.toISOString(),
          status: 'assigned',
          assignment_method: assignmentMethod,
        })
        .eq('id', task.id)
        .eq('status', 'open'); // Ensure concurrency protection

      if (assignError) {
        console.error(`Failed to assign task ${task.id}:`, assignError);
        continue;
      }

      // 7. Insert task_event
      await supabase.from('task_events').insert({
        task_id: task.id,
        event_type: 'auto_assigned',
        actor_id: null,
        metadata: {
          candidate_id: topCandidate.member_id,
          score: topCandidate.score,
          model_version: modelVersion,
          assignment_method: assignmentMethod,
        },
      });

      // 8. Send push notification to assigned candidate
      const { data: profile } = await supabase
        .from('profiles')
        .select('push_token')
        .eq('id', topCandidate.member_id)
        .single();

      if (profile?.push_token) {
        await sendExpoPushNotification({
          to: profile.push_token,
          title: 'Bro Auto-Assign',
          body: `Bro ơi! Việc "${task.title}" vừa được phân công cho bạn. Hoàn thành để nhận ${task.effort_points} điểm nhé!`,
          data: { type: 'task', task_id: task.id },
        });
      }

      assignedCount++;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        timestamp: now.toISOString(),
        tasks_assigned: assignedCount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('auto-assign-task fatal error:', errorMsg);
    return new Response(JSON.stringify({ ok: false, error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
