import { createAdminClient } from './supabaseServer';

export type ChurnRiskLevel = 'high' | 'medium' | 'healthy' | 'new';

export interface RoomHealthItem {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
  createdBy: string;
  isPro: boolean;
  maxMembers: number;
  activeMemberCount: number;
  leftMemberCount: number;
  totalTasks: number;
  completedTasks: number;
  expiredTasks: number;
  inProgressTasks: number;
  completionRate: number;
  lastActivityAt: string;
  daysSinceLastActivity: number;
  churnRisk: ChurnRiskLevel;
  churnRiskReasons: string[];
}

export interface RoomHealthSummary {
  totalRooms: number;
  healthyRooms: number;
  mediumRiskRooms: number;
  highRiskChurnRooms: number;
  newRooms: number;
  proRooms: number;
  rooms: RoomHealthItem[];
}

/**
 * Queries all rooms and aggregates task completion, activity freshness,
 * and member retention to evaluate churn risk.
 * (Architecture Section 7)
 */
export async function getRoomHealthSummary(): Promise<RoomHealthSummary> {
  const supabase = createAdminClient();
  const now = new Date();

  // 1. Query rooms
  const { data: roomsData, error: roomsErr } = await supabase
    .from('rooms')
    .select('id, name, invite_code, created_at, created_by, is_pro, max_members')
    .order('created_at', { ascending: false });

  if (roomsErr) {
    console.error('Error fetching rooms:', roomsErr);
    throw new Error('Failed to query rooms');
  }
  const rooms = roomsData || [];

  // 2. Query all room members
  const { data: membersData, error: membersErr } = await supabase
    .from('room_members')
    .select('room_id, member_id, left_at');

  if (membersErr) {
    console.error('Error fetching members:', membersErr);
  }
  const members = membersData || [];

  // 3. Query all tasks
  const { data: tasksData, error: tasksErr } = await supabase
    .from('task_instances')
    .select('id, room_id, status, created_at, submitted_at, approved_at');

  if (tasksErr) {
    console.error('Error fetching tasks for room health:', tasksErr);
  }
  const tasks = tasksData || [];

  // Map data by room_id
  const membersByRoom = new Map<string, { active: number; left: number }>();
  for (const m of members) {
    const entry = membersByRoom.get(m.room_id) || { active: 0, left: 0 };
    if (m.left_at) {
      entry.left++;
    } else {
      entry.active++;
    }
    membersByRoom.set(m.room_id, entry);
  }

  const tasksByRoom = new Map<
    string,
    {
      total: number;
      completed: number;
      expired: number;
      inProgress: number;
      lastActivityTime: number;
    }
  >();

  for (const t of tasks) {
    const entry = tasksByRoom.get(t.room_id) || {
      total: 0,
      completed: 0,
      expired: 0,
      inProgress: 0,
      lastActivityTime: 0,
    };

    entry.total++;
    if (t.status === 'completed') {
      entry.completed++;
    } else if (t.status === 'expired') {
      entry.expired++;
    } else {
      entry.inProgress++;
    }

    const tCreated = new Date(t.created_at).getTime();
    const tApproved = t.approved_at ? new Date(t.approved_at).getTime() : 0;
    const tSubmitted = t.submitted_at ? new Date(t.submitted_at).getTime() : 0;
    const activity = Math.max(tCreated, tApproved, tSubmitted);

    if (activity > entry.lastActivityTime) {
      entry.lastActivityTime = activity;
    }

    tasksByRoom.set(t.room_id, entry);
  }

  let healthyRooms = 0;
  let mediumRiskRooms = 0;
  let highRiskChurnRooms = 0;
  let newRooms = 0;
  let proRooms = 0;

  const roomItems: RoomHealthItem[] = rooms.map((room) => {
    if (room.is_pro) proRooms++;

    const memberStat = membersByRoom.get(room.id) || { active: 0, left: 0 };
    const taskStat = tasksByRoom.get(room.id) || {
      total: 0,
      completed: 0,
      expired: 0,
      inProgress: 0,
      lastActivityTime: 0,
    };

    const roomCreatedTime = new Date(room.created_at).getTime();
    const lastActivityTime = Math.max(roomCreatedTime, taskStat.lastActivityTime);
    const lastActivityAt = new Date(lastActivityTime).toISOString();
    const daysSinceLastActivity = Math.max(
      0,
      Math.floor((now.getTime() - lastActivityTime) / (1000 * 60 * 60 * 24))
    );

    const closedTasks = taskStat.completed + taskStat.expired;
    const completionRate =
      closedTasks > 0 ? (taskStat.completed / closedTasks) * 100 : 0;

    const reasons: string[] = [];
    let churnRisk: ChurnRiskLevel = 'healthy';

    const roomAgeDays = Math.floor(
      (now.getTime() - roomCreatedTime) / (1000 * 60 * 60 * 24)
    );

    if (roomAgeDays <= 3 && taskStat.total === 0) {
      churnRisk = 'new';
      reasons.push('Phòng mới khởi tạo (<3 ngày), chưa phát sinh task');
      newRooms++;
    } else if (daysSinceLastActivity >= 7 || (closedTasks >= 3 && completionRate < 40)) {
      churnRisk = 'high';
      if (daysSinceLastActivity >= 7) {
        reasons.push(`Không có tương tác trong ${daysSinceLastActivity} ngày`);
      }
      if (closedTasks >= 3 && completionRate < 40) {
        reasons.push(`Tỉ lệ hoàn thành thấp (${completionRate.toFixed(0)}%)`);
      }
      highRiskChurnRooms++;
    } else if (
      daysSinceLastActivity >= 4 ||
      (closedTasks >= 3 && completionRate < 60)
    ) {
      churnRisk = 'medium';
      if (daysSinceLastActivity >= 4) {
        reasons.push(`Hoạt động chậm lại (${daysSinceLastActivity} ngày trước)`);
      }
      if (closedTasks >= 3 && completionRate < 60) {
        reasons.push(`Tỉ lệ hoàn thành dưới mức chuẩn (${completionRate.toFixed(0)}%)`);
      }
      mediumRiskRooms++;
    } else {
      churnRisk = 'healthy';
      reasons.push('Hoạt động đều đặn, tỉ lệ hoàn thành tốt');
      healthyRooms++;
    }

    return {
      id: room.id,
      name: room.name,
      inviteCode: room.invite_code,
      createdAt: room.created_at,
      createdBy: room.created_by,
      isPro: room.is_pro,
      maxMembers: room.max_members,
      activeMemberCount: memberStat.active,
      leftMemberCount: memberStat.left,
      totalTasks: taskStat.total,
      completedTasks: taskStat.completed,
      expiredTasks: taskStat.expired,
      inProgressTasks: taskStat.inProgress,
      completionRate,
      lastActivityAt,
      daysSinceLastActivity,
      churnRisk,
      churnRiskReasons: reasons,
    };
  });

  return {
    totalRooms: rooms.length,
    healthyRooms,
    mediumRiskRooms,
    highRiskChurnRooms,
    newRooms,
    proRooms,
    rooms: roomItems,
  };
}
