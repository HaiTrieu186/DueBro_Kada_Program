'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabaseServer';

/**
 * Server action: Overrule the dispute (mark as dismissed / false report),
 * return task to pending_approval and trigger approve_task() to award points.
 */
export async function overruleDisputeAndApprove(disputeId: string, taskId: string) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // 1. Mark dispute as dismissed
  const { error: disputeErr } = await supabase
    .from('disputes')
    .update({
      status: 'dismissed',
      resolved_at: now,
    })
    .eq('id', disputeId);

  if (disputeErr) {
    throw new Error(`Failed to update dispute: ${disputeErr.message}`);
  }

  // 2. Set task to pending_approval so approve_task RPC accepts it
  const { error: taskErr } = await supabase
    .from('task_instances')
    .update({ status: 'pending_approval' })
    .eq('id', taskId);

  if (taskErr) {
    throw new Error(`Failed to reset task status: ${taskErr.message}`);
  }

  // 3. Call approve_task RPC
  const { error: approveErr } = await supabase.rpc('approve_task', {
    p_task_id: taskId,
  });

  if (approveErr) {
    console.error('approve_task error during dispute overrule:', approveErr);
    // Even if approve fails (e.g. already points), record was updated
  }

  // 4. Log admin audit event
  await supabase.from('task_events').insert({
    task_id: taskId,
    event_type: 'admin_dispute_overruled',
    metadata: {
      dispute_id: disputeId,
      action: 'task_approved_points_awarded',
      resolved_at: now,
    },
  });

  revalidatePath('/disputes');
  revalidatePath('/');
  return { success: true };
}

/**
 * Server action: Uphold dispute (mark as resolved / report valid),
 * set task back to 'open' so roommate must redo it or someone else claims it.
 */
export async function upholdDisputeAndReopen(disputeId: string, taskId: string) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // 1. Mark dispute as resolved
  const { error: disputeErr } = await supabase
    .from('disputes')
    .update({
      status: 'resolved',
      resolved_at: now,
    })
    .eq('id', disputeId);

  if (disputeErr) {
    throw new Error(`Failed to update dispute: ${disputeErr.message}`);
  }

  // 2. Reopen task
  const { error: taskErr } = await supabase
    .from('task_instances')
    .update({
      status: 'open',
      claimed_by: null,
      claimed_at: null,
      submitted_at: null,
    })
    .eq('id', taskId);

  if (taskErr) {
    throw new Error(`Failed to reopen task: ${taskErr.message}`);
  }

  // 3. Log admin audit event
  await supabase.from('task_events').insert({
    task_id: taskId,
    event_type: 'admin_dispute_upheld',
    metadata: {
      dispute_id: disputeId,
      action: 'task_reopened_for_redo',
      resolved_at: now,
    },
  });

  revalidatePath('/disputes');
  revalidatePath('/');
  return { success: true };
}
