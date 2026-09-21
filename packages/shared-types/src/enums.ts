// Enums matching PostgreSQL schema (Architecture v3 & Migrations 001-019)

export type MemberRole = 'host' | 'member';

export type TaskSource = 'recurring' | 'adhoc' | 'life_deadline';

export type TaskStatus =
  | 'open'
  | 'claimed'
  | 'assigned'
  | 'pending_approval'
  | 'disputed'
  | 'completed'
  | 'expired';

export type EscalationLevel = 'friendly' | 'due' | 'sarcastic' | 'sos';

export type PointType = 'effort_weekly' | 'karma_permanent';

export type PointReason =
  | 'task_base'
  | 'volunteer_bonus'
  | 'sos_rescue_bonus'
  | 'swap_karma_bonus'
  | 'weekly_reset'
  | 'manual_adjustment'
  | 'penalty'
  | 'karma_redemption';

export type AwayStatus = 'active' | 'away';

export type DisputeReasonCode =
  | 'not_clean'
  | 'missing_photo'
  | 'wrong_task'
  | 'other';

export type NotificationKind = 'escalation' | 'nudge' | 'system' | 'match';

export type NotificationPushStatus = 'pending' | 'sent' | 'failed' | 'skipped';

export type MatchIntent = 'seeking_roommate' | 'has_room';

export type Gender = 'male' | 'female' | 'other';

export type GenderPref = 'any' | 'same';

export type OccupationType = 'student' | 'worker' | 'freelancer' | 'other';

export type GuestFrequency = 'never' | 'rarely' | 'sometimes' | 'often';

export type MatchAction = 'liked' | 'passed';

export type ConnectionStatus = 'chatting' | 'room_proposed' | 'housed' | 'closed';

export type TrustLevel = 'gold' | 'silver' | 'bronze' | 'new';

export type LLMPurpose = 'bro_message' | 'match_reason' | 'seed_reply' | 'other';

export type AdminTimeseriesMetric = 'dau' | 'tasks_completed' | 'matches';

export type AdminDemoJob =
  | 'silent_approval'
  | 'escalate'
  | 'expire'
  | 'refresh_features'
  | 'weekly_targets';

export type WhitelistEvent =
  | 'app_open'
  | 'onboarding_done'
  | 'profile_saved'
  | 'match_viewed'
  | 'swipe'
  | 'chat_sent'
  | 'room_created'
  | 'task_claimed'
  | 'task_submitted';
