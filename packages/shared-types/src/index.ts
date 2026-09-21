export type TaskCategory =
  | 'cleaning'
  | 'trash'
  | 'kitchen'
  | 'shopping'
  | 'maintenance'
  | 'other';

export type TaskStatus =
  | 'open'
  | 'in_progress'
  | 'submitted'
  | 'completed'
  | 'disputed'
  | 'expired';

export type DisputeReasonCode =
  | 'not_clean'
  | 'incomplete'
  | 'wrong_task'
  | 'fake_photo'
  | 'other';

export type MemberRole = 'host' | 'member';

export interface RoomMember {
  user_id: string;
  room_id: string;
  role: MemberRole;
  joined_at: string;
  is_away: boolean;
}

export interface TaskInstance {
  id: string;
  room_id: string;
  title: string;
  category: TaskCategory;
  effort_points: number;
  status: TaskStatus;
  due_date: string;
  assigned_to: string | null;
  proof_photo_url: string | null;
  requires_photo: boolean;
  claimed_voluntarily: boolean;
  created_at: string;
}

export interface MatchSuggestion {
  candidate_id: string;
  display_name: string;
  avatar_url: string | null;
  compatibility_pct: number;
  matching_reasons: string[];
  consideration: string | null;
  trust_score: number;
  is_seed_data: boolean;
}

export interface OverviewKPIs {
  total_rooms: number;
  active_members: number;
  tasks_completed_this_week: number;
  chore_completion_rate: number;
  total_llm_cost_usd: number;
  total_disputes_pending: number;
}
