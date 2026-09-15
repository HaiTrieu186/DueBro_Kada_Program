// Edge Function: escalate-reminders (Architecture Section 6.4 & 8)
// Triggered by pg_cron every 5 minutes.
// Scans upcoming and overdue tasks, calculates escalation levels, and sends Bro voice notifications.

import { corsHeaders } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabaseClient.ts';
import { renderBroMessage, EscalationLevel } from '../_shared/broVoice.ts';
import { sendBatchExpoPushNotifications, ExpoPushMessage } from '../_shared/expoPush.ts';

interface TaskWithRoom {
  id: string;
  room_id: string;
  title: string;
  effort_points: number;
  status: string;
  due_at: string;
  claimed_by: string | null;
  last_escalation_level: EscalationLevel | null;
  rooms: {
    mascot_name: string | null;
  } | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createAdminClient();
    const now = new Date();
    const nowMs = now.getTime();

    // Query all active tasks that have not yet completed
    const { data: tasks, error: tasksError } = await supabase
      .from('task_instances')
      .select('id, room_id, title, effort_points, status, due_at, claimed_by, last_escalation_level, rooms(mascot_name)')
      .in('status', ['open', 'claimed', 'assigned'])
      .not('due_at', 'is', null);

    if (tasksError) {
      console.error('Error querying tasks for escalation:', tasksError);
      throw tasksError;
    }

    let escalatedCount = 0;
    const notificationsToLog: Array<{
      room_id: string;
      recipient_id: string;
      task_id: string;
      level: EscalationLevel;
      message: string;
    }> = [];
    const pushBatch: ExpoPushMessage[] = [];

    for (const task of (tasks as unknown as TaskWithRoom[] || [])) {
      const dueAt = new Date(task.due_at);
      const minutesToDue = (dueAt.getTime() - nowMs) / (1000 * 60);

      let targetLevel: EscalationLevel | null = null;

      // Escalation Matrix (Architecture Section 6.4)
      if (minutesToDue > 0 && minutesToDue <= 120) {
        // Trước hạn 2h
        targetLevel = 'friendly';
      } else if (minutesToDue <= 0 && minutesToDue >= -5) {
        // Đúng hạn (dung sai 5 phút của cron)
        targetLevel = 'due';
      } else if (minutesToDue < -120 && minutesToDue >= -360) {
        // Trễ 2 - 6h
        targetLevel = 'sarcastic';
      } else if (minutesToDue < -720) {
        // Trễ > 12h: SOS
        targetLevel = 'sos';
      }

      // If no escalation bucket matches or level hasn't changed, skip
      if (!targetLevel || task.last_escalation_level === targetLevel) {
        continue;
      }

      const mascotName = task.rooms?.mascot_name || 'Bro';
      const dueTimeFormatted = dueAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const renderedMsg = renderBroMessage(targetLevel, {
        task_title: task.title,
        points: task.effort_points,
        due_time: dueTimeFormatted,
        mascot_name: mascotName,
      });

      // Determine recipients
      let recipientUserIds: string[] = [];

      if (targetLevel === 'sos' || !task.claimed_by) {
        // Broadcast to all active room members on SOS or unassigned task
        const { data: members } = await supabase
          .from('room_members')
          .select('member_id')
          .eq('room_id', task.room_id)
          .is('left_at', null)
          .eq('away_status', 'active');

        recipientUserIds = (members || []).map((m) => m.member_id);
      } else if (task.claimed_by) {
        recipientUserIds = [task.claimed_by];
      }

      if (recipientUserIds.length === 0) {
        continue;
      }

      // Query push tokens for recipients
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, push_token')
        .in('id', recipientUserIds)
        .not('push_token', 'is', null);

      for (const prof of (profiles || [])) {
        if (prof.push_token) {
          pushBatch.push({
            to: prof.push_token,
            title: `${mascotName} Remind`,
            body: renderedMsg,
            data: { type: 'task', task_id: task.id },
          });

          notificationsToLog.push({
            room_id: task.room_id,
            recipient_id: prof.id,
            task_id: task.id,
            level: targetLevel,
            message: renderedMsg,
          });
        }
      }

      // Update task instance status and level
      const updatePayload: Record<string, unknown> = {
        last_escalation_level: targetLevel,
      };

      if (targetLevel === 'sos') {
        updatePayload.bonus_multiplier = 1.5; // Emergency SOS x1.5 points
      }

      await supabase.from('task_instances').update(updatePayload).eq('id', task.id);

      // Log task event
      await supabase.from('task_events').insert({
        task_id: task.id,
        event_type: 'escalation_sent',
        actor_id: null,
        metadata: {
          level: targetLevel,
          recipients_count: recipientUserIds.length,
        },
      });

      escalatedCount++;
    }

    // Send push notifications in batch
    if (pushBatch.length > 0) {
      await sendBatchExpoPushNotifications(pushBatch);
    }

    // Insert notifications_log entries
    if (notificationsToLog.length > 0) {
      await supabase.from('notifications_log').insert(notificationsToLog);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        timestamp: now.toISOString(),
        tasks_escalated: escalatedCount,
        notifications_sent: pushBatch.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('escalate-reminders fatal error:', errorMsg);
    return new Response(JSON.stringify({ ok: false, error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
