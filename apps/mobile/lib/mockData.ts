// Due Bro — Full Mock Dataset
// Mirrors DB schema exactly; swap with Supabase queries in Sprint 4

export type TaskStatus = 'open' | 'claimed' | 'assigned' | 'pending_approval' | 'disputed' | 'completed' | 'expired';
export type TaskSource = 'recurring' | 'adhoc' | 'life_deadline';
export type EscalationLevel = 'friendly' | 'due' | 'sarcastic' | 'sos';
export type MemberRole = 'host' | 'member';

export interface Profile {
  id: string;
  display_name: string;
  avatar_color: string;
  avatar_initial: string;
  push_token?: string;
}

export interface RoomMember {
  room_id: string;
  member_id: string;
  role: MemberRole;
  away_status: 'active' | 'away';
  away_from?: string;
  away_to?: string;
  karma_score: number;
  is_new_member_until?: string;
}

export interface TaskInstance {
  id: string;
  room_id: string;
  source: TaskSource;
  title: string;
  category: string;
  effort_points: number;
  requires_photo: boolean;
  status: TaskStatus;
  due_at: string; // ISO string
  claimed_by?: string;
  assignment_method?: string;
  bonus_multiplier: number;
  last_escalation_level?: EscalationLevel;
  nudge_count: number;
}

export interface WeeklyProgress {
  member_id: string;
  achieved_points: number;
  target_points: number;
  week_start: string;
}

// ─── Mock data ───────────────────────────────────────────────
export const MOCK_ROOM = {
  id: 'room-402',
  name: 'Brothers Room 402',
  invite_code: 'BRO402',
  mascot_name: 'Bro',
  is_pro: false,
  max_members: 4,
  streak_days: 6,
};

export const MOCK_PROFILES: Record<string, Profile> = {
  'user-hoang': { id: 'user-hoang', display_name: 'Hoàng', avatar_color: '#18181B', avatar_initial: 'H' },
  'user-nam':   { id: 'user-nam',   display_name: 'Nam',   avatar_color: '#7C3AED', avatar_initial: 'N' },
  'user-linh':  { id: 'user-linh',  display_name: 'Linh',  avatar_color: '#10B981', avatar_initial: 'L' },
  'user-duc':   { id: 'user-duc',   display_name: 'Đức',   avatar_color: '#F97316', avatar_initial: 'Đ' },
};

export const MOCK_MEMBERS: RoomMember[] = [
  { room_id: 'room-402', member_id: 'user-hoang', role: 'host',   away_status: 'active', karma_score: 280 },
  { room_id: 'room-402', member_id: 'user-nam',   role: 'member', away_status: 'active', karma_score: 195 },
  { room_id: 'room-402', member_id: 'user-linh',  role: 'member', away_status: 'active', karma_score: 220 },
  { room_id: 'room-402', member_id: 'user-duc',   role: 'member', away_status: 'away',   karma_score: 140, away_from: '2026-09-14', away_to: '2026-09-20' },
];

const now = new Date();
const h = (hours: number) => new Date(now.getTime() + hours * 3600000).toISOString();

export const MOCK_TASKS: TaskInstance[] = [
  {
    id: 'task-001',
    room_id: 'room-402',
    source: 'recurring',
    title: 'Đổ rác & thay túi mới',
    category: 'Vệ sinh',
    effort_points: 5,
    requires_photo: false,
    status: 'assigned',
    due_at: h(2),
    claimed_by: 'user-hoang',
    assignment_method: 'auto_round_robin',
    bonus_multiplier: 1.0,
    last_escalation_level: 'friendly',
    nudge_count: 1,
  },
  {
    id: 'task-002',
    room_id: 'room-402',
    source: 'recurring',
    title: 'Rửa chén bát & dọn bồn bếp',
    category: 'Bếp núc',
    effort_points: 15,
    requires_photo: false,
    status: 'claimed',
    due_at: h(4.5),
    claimed_by: 'user-nam',
    assignment_method: 'volunteer',
    bonus_multiplier: 1.1,
    nudge_count: 0,
  },
  {
    id: 'task-003',
    room_id: 'room-402',
    source: 'life_deadline',
    title: 'Tiền điện phòng tháng 9',
    category: 'Hóa đơn',
    effort_points: 0,
    requires_photo: false,
    status: 'open',
    due_at: h(72),
    bonus_multiplier: 1.0,
    nudge_count: 0,
  },
  {
    id: 'task-004',
    room_id: 'room-402',
    source: 'adhoc',
    title: 'Mua túi rác & nước rửa bát mới',
    category: 'Mua sắm',
    effort_points: 10,
    requires_photo: false,
    status: 'open',
    due_at: h(48),
    bonus_multiplier: 1.0,
    nudge_count: 0,
  },
  {
    id: 'task-005',
    room_id: 'room-402',
    source: 'recurring',
    title: 'Cọ rửa nhà vệ sinh',
    category: 'Vệ sinh',
    effort_points: 35,
    requires_photo: true,
    status: 'open',
    due_at: h(24),
    bonus_multiplier: 1.0,
    nudge_count: 0,
  },
  {
    id: 'task-006',
    room_id: 'room-402',
    source: 'recurring',
    title: 'Quét & lau sàn nhà chung',
    category: 'Vệ sinh',
    effort_points: 20,
    requires_photo: false,
    status: 'pending_approval',
    due_at: h(-1),
    claimed_by: 'user-linh',
    assignment_method: 'volunteer',
    bonus_multiplier: 1.1,
    nudge_count: 2,
  },
];

export const MOCK_WEEKLY_PROGRESS: WeeklyProgress[] = [
  { member_id: 'user-hoang', achieved_points: 45, target_points: 60, week_start: '2026-09-14' },
  { member_id: 'user-nam',   achieved_points: 30, target_points: 60, week_start: '2026-09-14' },
  { member_id: 'user-linh',  achieved_points: 55, target_points: 60, week_start: '2026-09-14' },
  { member_id: 'user-duc',   achieved_points: 10, target_points: 60, week_start: '2026-09-14' },
];

export const MOCK_BILL_STATUS: Record<string, string[]> = {
  'task-003': ['user-hoang', 'user-linh'], // đã đóng
};

// ─── Bro Voice messages ───────────────────────────────────────
export const BRO_MESSAGES: Record<EscalationLevel, string[]> = {
  friendly: [
    'Bro ơi, lát nhớ làm nhé. Easy {pts} points! 😎',
    'Hey {name}, {task} đang chờ nha. Nhanh thôi!',
  ],
  due: [
    'Bro, it\'s due! Đến giờ {task} rồi kìa, làm nhanh còn nghỉ ngơi!',
    '⏰ {name}! Hạn chót đến rồi. Vào làm {task} thôi nào!',
  ],
  sarcastic: [
    'Bro... mày tính để {task} mọc nấm men mới làm hả? 💀',
    '{name} ơi, {task} đang trồng cỏ rồi kìa bro. Vào xác nhận đi nè!',
  ],
  sos: [
    '🚨 Task {task} đang bị "đóng băng" rồi. Ai trong phòng giải cứu được x1.5 điểm luôn nhé!',
    'SOS! {task} cần người hùng ngay bây giờ! Reward: x1.5 điểm 🆘',
  ],
};

// Karma titles by score
export const KARMA_TITLES = [
  { min: 0,   max: 49,  title: 'Tân Binh 🐣',         badge: '🐣' },
  { min: 50,  max: 99,  title: 'Rookie Bro 🙂',        badge: '🙂' },
  { min: 100, max: 199, title: 'Bro Chăm Chỉ 💪',      badge: '💪' },
  { min: 200, max: 299, title: 'Thánh Lau Nhà 🧹',     badge: '🧹' },
  { min: 300, max: 499, title: 'Chúa Tể Đổ Vỏ 🗑️',    badge: '🗑️' },
  { min: 500, max: 999, title: 'Bro Huyền Thoại ✨',   badge: '✨' },
  { min: 1000,max: Infinity, title: 'Bro Vũ Trụ 🌌',  badge: '🌌' },
];

export function getKarmaTitle(score: number) {
  return KARMA_TITLES.find(t => score >= t.min && score <= t.max) ?? KARMA_TITLES[0];
}

export function getTaskUrgency(task: TaskInstance): 'sos' | 'urgent' | 'bill' | 'routine' {
  if (task.source === 'life_deadline') return 'bill';
  const msLeft = new Date(task.due_at).getTime() - Date.now();
  const hoursLeft = msLeft / 3600000;
  if (hoursLeft < -12) return 'sos';
  if (hoursLeft <= 2) return 'urgent';
  return 'routine';
}
