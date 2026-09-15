import { createAdminClient } from './supabaseServer';

export interface KpiSummary {
  totalRooms: number;
  activeRooms7d: number;
  proRooms: number;
  proConversionRate: number;
  totalMembers: number;
  totalTasks: number;
  completedTasks: number;
  expiredTasks: number;
  inProgressTasks: number;
  completionRate: number;
  onTimeCompletionRate: number;
  openDisputesCount: number;
  retentionRate30d: number | null;
  tasksByCategory: { category: string; count: number }[];
  recentActivityTimeline: { date: string; completed: number; created: number }[];
}

/**
 * Server-side aggregator for North Star Operations Metrics.
 * Uses service_role client to bypass room isolation RLS.
 * (Architecture Section 7)
 */
export async function getKpiSummary(): Promise<KpiSummary> {
  const supabase = createAdminClient();

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 1. Fetch Rooms
  const { data: roomsData, error: roomsErr } = await supabase
    .from('rooms')
    .select('id, created_at, is_pro');

  if (roomsErr) {
    console.error('Failed to fetch rooms KPI:', roomsErr);
  }
  const rooms = roomsData || [];
  const totalRooms = rooms.length;
  const proRooms = rooms.filter((r) => r.is_pro).length;
  const proConversionRate = totalRooms > 0 ? (proRooms / totalRooms) * 100 : 0;

  // 2. Fetch Active Members Count
  const { count: totalMembersCount, error: membersErr } = await supabase
    .from('room_members')
    .select('*', { count: 'exact', head: true })
    .is('left_at', null);

  if (membersErr) {
    console.error('Failed to fetch members KPI:', membersErr);
  }
  const totalMembers = totalMembersCount || 0;

  // 3. Fetch Tasks
  const { data: tasksData, error: tasksErr } = await supabase
    .from('task_instances')
    .select('id, room_id, status, due_at, submitted_at, approved_at, category, created_at');

  if (tasksErr) {
    console.error('Failed to fetch tasks KPI:', tasksErr);
  }
  const tasks = tasksData || [];
  const totalTasks = tasks.length;

  let completedTasks = 0;
  let expiredTasks = 0;
  let inProgressTasks = 0;
  let onTimeTasks = 0;
  const activeRooms7dSet = new Set<string>();
  const categoryCounts: Record<string, number> = {};

  // Timeline map for last 7 days
  const timelineMap: Record<string, { completed: number; created: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    timelineMap[dateStr] = { completed: 0, created: 0 };
  }

  for (const t of tasks) {
    // Category distribution
    const cat = t.category || 'other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

    // Timeline creation
    const createdDate = t.created_at.split('T')[0];
    if (timelineMap[createdDate]) {
      timelineMap[createdDate].created++;
    }

    // Active rooms check (task created or approved within last 7 days)
    const taskCreatedAt = new Date(t.created_at);
    const taskApprovedAt = t.approved_at ? new Date(t.approved_at) : null;
    const taskSubmittedAt = t.submitted_at ? new Date(t.submitted_at) : null;

    if (
      taskCreatedAt >= sevenDaysAgo ||
      (taskApprovedAt && taskApprovedAt >= sevenDaysAgo) ||
      (taskSubmittedAt && taskSubmittedAt >= sevenDaysAgo)
    ) {
      activeRooms7dSet.add(t.room_id);
    }

    if (t.status === 'completed') {
      completedTasks++;
      if (t.approved_at) {
        const approvedDate = t.approved_at.split('T')[0];
        if (timelineMap[approvedDate]) {
          timelineMap[approvedDate].completed++;
        }
      }

      // Check on-time completion: submitted_at <= due_at OR (no submitted_at and approved_at <= due_at)
      const dueTime = new Date(t.due_at).getTime();
      const finishTime = t.submitted_at
        ? new Date(t.submitted_at).getTime()
        : t.approved_at
        ? new Date(t.approved_at).getTime()
        : null;

      if (finishTime !== null && finishTime <= dueTime) {
        onTimeTasks++;
      }
    } else if (t.status === 'expired') {
      expiredTasks++;
    } else {
      inProgressTasks++;
    }
  }

  const finishedTasks = completedTasks + expiredTasks;
  const completionRate = finishedTasks > 0 ? (completedTasks / finishedTasks) * 100 : 0;
  const onTimeCompletionRate = completedTasks > 0 ? (onTimeTasks / completedTasks) * 100 : 0;

  // 4. Calculate 30-Day Retention
  const rooms30dOld = rooms.filter((r) => new Date(r.created_at) <= thirtyDaysAgo);
  let retentionRate30d: number | null = null;
  if (rooms30dOld.length > 0) {
    const retainedRooms = rooms30dOld.filter((r) => activeRooms7dSet.has(r.id));
    retentionRate30d = (retainedRooms.length / rooms30dOld.length) * 100;
  }

  // 5. Fetch Open Disputes Count
  const { count: openDisputesCountResult, error: disputesErr } = await supabase
    .from('disputes')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open');

  if (disputesErr) {
    console.error('Failed to fetch disputes KPI:', disputesErr);
  }
  const openDisputesCount = openDisputesCountResult || 0;

  // Convert categories map to sorted array
  const tasksByCategory = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // Convert timeline map to array
  const recentActivityTimeline = Object.entries(timelineMap).map(([date, counts]) => ({
    date,
    completed: counts.completed,
    created: counts.created,
  }));

  return {
    totalRooms,
    activeRooms7d: activeRooms7dSet.size,
    proRooms,
    proConversionRate,
    totalMembers,
    totalTasks,
    completedTasks,
    expiredTasks,
    inProgressTasks,
    completionRate,
    onTimeCompletionRate,
    openDisputesCount,
    retentionRate30d,
    tasksByCategory,
    recentActivityTimeline,
  };
}
