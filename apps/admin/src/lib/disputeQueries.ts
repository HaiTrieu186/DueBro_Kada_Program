import { createAdminClient } from './supabaseServer';

export interface DisputeItem {
  id: string;
  taskId: string;
  taskTitle: string;
  taskStatus: string;
  taskDueAt: string;
  taskSubmittedAt: string | null;
  roomId: string;
  roomName: string;
  raisedBy: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  assignee: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
  reason: string | null;
  status: 'open' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt: string | null;
  photoUrl?: string | null;
}

export interface DisputeSummary {
  totalDisputes: number;
  openCount: number;
  resolvedCount: number;
  dismissedCount: number;
  items: DisputeItem[];
}

/**
 * Fetches disputes across all rooms using service_role client.
 * NOTE: Reveals `raised_by` profile identity (Anonymity Shield bypass for Ops moderation).
 * (Architecture Section 6.6 & 7)
 */
export async function getDisputesList(): Promise<DisputeSummary> {
  const supabase = createAdminClient();

  // 1. Fetch raw disputes
  const { data: rawDisputes, error: disputesErr } = await supabase
    .from('disputes')
    .select('id, task_id, room_id, raised_by, reason, status, created_at, resolved_at')
    .order('created_at', { ascending: false });

  if (disputesErr) {
    console.error('Failed to fetch disputes list:', disputesErr);
    throw new Error('Failed to fetch disputes');
  }

  const disputes = rawDisputes || [];

  if (disputes.length === 0) {
    return {
      totalDisputes: 0,
      openCount: 0,
      resolvedCount: 0,
      dismissedCount: 0,
      items: [],
    };
  }

  // 2. Collect unique task_ids, room_ids, profile_ids
  const taskIds = Array.from(new Set(disputes.map((d) => d.task_id)));
  const roomIds = Array.from(new Set(disputes.map((d) => d.room_id)));
  const profileIds = new Set<string>(disputes.map((d) => d.raised_by));

  // 3. Fetch rooms
  const { data: roomsData } = await supabase
    .from('rooms')
    .select('id, name')
    .in('id', roomIds);
  const roomMap = new Map((roomsData || []).map((r) => [r.id, r.name]));

  // 4. Fetch tasks
  const { data: tasksData } = await supabase
    .from('task_instances')
    .select('id, title, status, due_at, submitted_at, claimed_by')
    .in('id', taskIds);
  const taskMap = new Map((tasksData || []).map((t) => [t.id, t]));

  for (const t of tasksData || []) {
    if (t.claimed_by) {
      profileIds.add(t.claimed_by);
    }
  }

  // 5. Fetch profiles (full unmasked identity for ops)
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', Array.from(profileIds));
  const profileMap = new Map((profilesData || []).map((p) => [p.id, p]));

  // 6. Fetch task photos if any
  const { data: photosData } = await supabase
    .from('task_photos')
    .select('task_id, storage_path')
    .in('task_id', taskIds);
  const photoMap = new Map((photosData || []).map((p) => [p.task_id, p.storage_path]));

  let openCount = 0;
  let resolvedCount = 0;
  let dismissedCount = 0;

  const items: DisputeItem[] = disputes.map((d) => {
    if (d.status === 'open') openCount++;
    else if (d.status === 'resolved') resolvedCount++;
    else if (d.status === 'dismissed') dismissedCount++;

    const task = taskMap.get(d.task_id);
    const reporter = profileMap.get(d.raised_by);
    const assignee = task?.claimed_by ? profileMap.get(task.claimed_by) : null;
    const roomName = roomMap.get(d.room_id) || 'Phòng không xác định';

    return {
      id: d.id,
      taskId: d.task_id,
      taskTitle: task?.title || 'Task đã xóa',
      taskStatus: task?.status || 'unknown',
      taskDueAt: task?.due_at || '',
      taskSubmittedAt: task?.submitted_at || null,
      roomId: d.room_id,
      roomName,
      raisedBy: {
        id: d.raised_by,
        displayName: reporter?.display_name || 'Người dùng ẩn danh',
        avatarUrl: reporter?.avatar_url || null,
      },
      assignee: assignee
        ? {
            id: assignee.id,
            displayName: assignee.display_name || 'Thành viên phòng',
            avatarUrl: assignee.avatar_url || null,
          }
        : null,
      reason: d.reason,
      status: (d.status as 'open' | 'resolved' | 'dismissed') || 'open',
      createdAt: d.created_at,
      resolvedAt: d.resolved_at,
      photoUrl: photoMap.get(d.task_id) || null,
    };
  });

  return {
    totalDisputes: disputes.length,
    openCount,
    resolvedCount,
    dismissedCount,
    items,
  };
}
