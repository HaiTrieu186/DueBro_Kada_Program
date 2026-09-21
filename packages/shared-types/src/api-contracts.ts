import { z } from 'zod';
import type {
  MemberRole,
  TaskSource,
  TaskStatus,
  EscalationLevel,
  PointType,
  PointReason,
  AwayStatus,
  DisputeReasonCode,
  NotificationKind,
  NotificationPushStatus,
  MatchIntent,
  Gender,
  GenderPref,
  OccupationType,
  GuestFrequency,
  MatchAction,
  ConnectionStatus,
  TrustLevel,
  LLMPurpose,
  AdminTimeseriesMetric,
  AdminDemoJob,
  WhitelistEvent,
} from './enums';

// ============================================================
// 1. Auth & Profiles
// ============================================================

export const ProfilePublicSchema = z.object({
  id: z.string().uuid(),
  display_name: z.string(),
  avatar_url: z.string().nullable(),
  created_at: z.string().datetime(),
});
export type ProfilePublic = z.infer<typeof ProfilePublicSchema>;

export const LifestyleProfileBaseSchema = z.object({
  intent: z.enum(['seeking_roommate', 'has_room']).default('seeking_roommate'),
  city: z.string().min(1, 'Thành phố là bắt buộc'),
  district: z.string().optional().nullable(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  gender_pref: z.enum(['any', 'same']).default('any'),
  occupation_type: z.enum(['student', 'worker', 'freelancer', 'other']),
  wake_up_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Giờ thức dậy không hợp lệ (HH:MM)'),
  sleep_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Giờ đi ngủ không hợp lệ (HH:MM)'),
  budget_min: z.number().int().min(0, 'Ngân sách tối thiểu >= 0'),
  budget_max: z.number().int().min(0),
  tidiness_level: z.number().int().min(1).max(5),
  noise_tolerance: z.number().int().min(1).max(5),
  smokes: z.boolean().default(false),
  has_pet: z.boolean().default(false),
  guest_frequency: z.enum(['never', 'rarely', 'sometimes', 'often']).default('sometimes'),
  guest_curfew: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/).optional().nullable(),
  bio: z.string().max(300, 'Bio tối đa 300 ký tự').optional().nullable(),
});

export const LifestyleProfileInputSchema = LifestyleProfileBaseSchema.refine(data => data.budget_max >= data.budget_min, {
  message: 'Ngân sách tối đa phải lớn hơn hoặc bằng ngân sách tối thiểu',
  path: ['budget_max'],
});
export type LifestyleProfileInput = z.infer<typeof LifestyleProfileInputSchema>;

export const LifestyleProfileSchema = LifestyleProfileBaseSchema.extend({
  user_id: z.string().uuid(),
  is_seed_data: z.boolean(),
  seed_trust_score: z.number().int().nullable().optional(),
  updated_at: z.string().datetime(),
}).refine(data => data.budget_max >= data.budget_min, {
  message: 'Ngân sách tối đa phải lớn hơn hoặc bằng ngân sách tối thiểu',
  path: ['budget_max'],
});
export type LifestyleProfile = z.infer<typeof LifestyleProfileSchema>;


export const TrackEventInputSchema = z.object({
  p_event: z.enum([
    'app_open', 'onboarding_done', 'profile_saved', 'match_viewed',
    'swipe', 'chat_sent', 'room_created', 'task_claimed', 'task_submitted'
  ]),
  p_props: z.record(z.unknown()).default({}),
});
export type TrackEventInput = z.infer<typeof TrackEventInputSchema>;

// ============================================================
// 2. Room & Membership
// ============================================================

export const CreateRoomInputSchema = z.object({
  p_name: z.string().min(2, 'Tên phòng tối thiểu 2 ký tự').max(50, 'Tên phòng tối đa 50 ký tự'),
});
export type CreateRoomInput = z.infer<typeof CreateRoomInputSchema>;

export const JoinRoomInputSchema = z.object({
  p_invite_code: z.string().length(6, 'Mã mời phải gồm đúng 6 ký tự').toUpperCase(),
});
export type JoinRoomInput = z.infer<typeof JoinRoomInputSchema>;

export const LeaveRoomInputSchema = z.object({
  p_room_id: z.string().uuid(),
  p_new_host_id: z.string().uuid().optional().nullable(),
});
export type LeaveRoomInput = z.infer<typeof LeaveRoomInputSchema>;

export const RoomSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  invite_code: z.string(),
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
  max_members: z.number().int().default(4),
});
export type Room = z.infer<typeof RoomSchema>;

export const RoomMemberSchema = z.object({
  room_id: z.string().uuid(),
  member_id: z.string().uuid(),
  role: z.enum(['host', 'member']),
  joined_at: z.string().datetime(),
  left_at: z.string().datetime().nullable(),
  away_status: z.enum(['active', 'away']),
  away_from: z.string().nullable(),
  away_to: z.string().nullable(),
  is_new_member_until: z.string().datetime().nullable(),
});
export type RoomMember = z.infer<typeof RoomMemberSchema>;

// ============================================================
// 3. Task & Chore Lifecycle
// ============================================================

export const TaskCategorySchema = z.enum([
  'cleaning', 'trash', 'kitchen', 'shopping', 'maintenance', 'other'
]);
export type TaskCategory = z.infer<typeof TaskCategorySchema>;

export const CreateAdhocTaskInputSchema = z.object({
  p_room_id: z.string().uuid(),
  p_title: z.string().min(2, 'Tên việc tối thiểu 2 ký tự').max(100, 'Tên việc tối đa 100 ký tự'),
  p_category: z.string(),
  p_effort_points: z.number().int().min(5, 'Tối thiểu 5 điểm').max(100, 'Tối đa 100 điểm'),
  p_due_at: z.string().datetime({ message: 'Hạn chót không hợp lệ' }),
});
export type CreateAdhocTaskInput = z.infer<typeof CreateAdhocTaskInputSchema>;

export const ClaimTaskInputSchema = z.object({
  p_task_id: z.string().uuid(),
});
export type ClaimTaskInput = z.infer<typeof ClaimTaskInputSchema>;

export const SubmitTaskInputSchema = z.object({
  p_task_id: z.string().uuid(),
  p_photo_path: z.string().optional().nullable(),
});
export type SubmitTaskInput = z.infer<typeof SubmitTaskInputSchema>;

export const RequestNudgeInputSchema = z.object({
  p_task_id: z.string().uuid(),
});
export type RequestNudgeInput = z.infer<typeof RequestNudgeInputSchema>;

export const DisputeTaskInputSchema = z.object({
  p_task_id: z.string().uuid(),
  p_reason_code: z.enum(['not_clean', 'missing_photo', 'wrong_task', 'other']),
  p_reason: z.string().max(500).optional().nullable(),
});
export type DisputeTaskInput = z.infer<typeof DisputeTaskInputSchema>;

export const ResolveDisputeInputSchema = z.object({
  p_task_id: z.string().uuid(),
  p_decision: z.enum(['uphold', 'dismiss']),
});
export type ResolveDisputeInput = z.infer<typeof ResolveDisputeInputSchema>;

export const TaskInstanceSchema = z.object({
  id: z.string().uuid(),
  room_id: z.string().uuid(),
  source: z.enum(['recurring', 'adhoc', 'life_deadline']).optional(),
  template_id: z.string().uuid().nullable().optional(),
  title: z.string(),
  category: TaskCategorySchema,
  effort_points: z.number().int(),
  requires_photo: z.boolean(),
  due_at: z.string(),
  due_date: z.string().optional(),
  status: z.enum(['open', 'claimed', 'assigned', 'pending_approval', 'disputed', 'completed', 'expired']),
  claimed_by: z.string().uuid().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  claimed_at: z.string().nullable().optional(),
  submitted_at: z.string().nullable().optional(),
  bonus_multiplier: z.number().optional(),
  assignment_method: z.string().optional(),
  original_owner_id: z.string().uuid().nullable().optional(),
  last_escalation_level: z.enum(['friendly', 'due', 'sarcastic', 'sos']).nullable().optional(),
  last_escalated_at: z.string().nullable().optional(),
  created_at: z.string(),
});
export type TaskInstance = z.infer<typeof TaskInstanceSchema>;


export const DisputePublicSchema = z.object({
  id: z.string().uuid(),
  task_id: z.string().uuid(),
  room_id: z.string().uuid(),
  reason_code: z.enum(['not_clean', 'missing_photo', 'wrong_task', 'other']),
  status: z.string(),
  created_at: z.string().datetime(),
});
export type DisputePublic = z.infer<typeof DisputePublicSchema>;

// ============================================================
// 4. Advanced Household (SOS Swap, Away, Karma)
// ============================================================

export const RequestSwapInputSchema = z.object({
  p_task_id: z.string().uuid(),
});
export type RequestSwapInput = z.infer<typeof RequestSwapInputSchema>;

export const AcceptSwapInputSchema = z.object({
  p_swap_id: z.string().uuid(),
});
export type AcceptSwapInput = z.infer<typeof AcceptSwapInputSchema>;

export const CancelSwapInputSchema = z.object({
  p_swap_id: z.string().uuid(),
});
export type CancelSwapInput = z.infer<typeof CancelSwapInputSchema>;

export const SwapRequestSchema = z.object({
  id: z.string().uuid(),
  task_id: z.string().uuid(),
  requested_by: z.string().uuid(),
  status: z.string(),
  accepted_by: z.string().uuid().nullable(),
  accepted_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});
export type SwapRequest = z.infer<typeof SwapRequestSchema>;

export const SetAwayModeInputSchema = z.object({
  p_room_id: z.string().uuid(),
  p_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày YYYY-MM-DD'),
  p_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày YYYY-MM-DD'),
});
export type SetAwayModeInput = z.infer<typeof SetAwayModeInputSchema>;

export const ClearAwayModeInputSchema = z.object({
  p_room_id: z.string().uuid(),
});
export type ClearAwayModeInput = z.infer<typeof ClearAwayModeInputSchema>;

export const RedeemKarmaInputSchema = z.object({
  p_room_id: z.string().uuid(),
  p_reward_type: z.enum(['skip_next_task']),
});
export type RedeemKarmaInput = z.infer<typeof RedeemKarmaInputSchema>;

export const WeeklyQuotaProgressSchema = z.object({
  room_id: z.string().uuid(),
  member_id: z.string().uuid(),
  week_start: z.string(),
  achieved_points: z.number(),
  target_points: z.number(),
});
export type WeeklyQuotaProgress = z.infer<typeof WeeklyQuotaProgressSchema>;

// ============================================================
// 5. Matching & Trust
// ============================================================

export const ComputeMatchesInputSchema = z.object({
  limit: z.number().int().min(1).max(50).default(20),
});
export type ComputeMatchesInput = z.infer<typeof ComputeMatchesInputSchema>;

export const MatchSuggestionItemSchema = z.object({
  candidate_id: z.string().uuid(),
  compatibility_score: z.number().min(0).max(1),
  breakdown: z.record(z.number()),
  reasons: z.object({
    strengths: z.array(z.string()),
    conflicts: z.array(z.string()),
  }),
});
export type MatchSuggestionItem = z.infer<typeof MatchSuggestionItemSchema>;

export const ComputeMatchesResponseSchema = z.object({
  model_version: z.string(),
  count: z.number().int(),
  suggestions: z.array(MatchSuggestionItemSchema),
});
export type ComputeMatchesResponse = z.infer<typeof ComputeMatchesResponseSchema>;

export const SwipeInputSchema = z.object({
  p_candidate_id: z.string().uuid(),
  p_action: z.enum(['liked', 'passed']),
});
export type SwipeInput = z.infer<typeof SwipeInputSchema>;

export const SwipeResponseSchema = z.object({
  matched: z.boolean(),
  connection_id: z.string().uuid().optional(),
});
export type SwipeResponse = z.infer<typeof SwipeResponseSchema>;

export const ProposeRoomInputSchema = z.object({
  p_connection_id: z.string().uuid(),
  p_room_name: z.string().min(2, 'Tên phòng tối thiểu 2 ký tự').max(50),
});
export type ProposeRoomInput = z.infer<typeof ProposeRoomInputSchema>;

export const AcceptRoomInputSchema = z.object({
  p_connection_id: z.string().uuid(),
});
export type AcceptRoomInput = z.infer<typeof AcceptRoomInputSchema>;

export const MatchConnectionSchema = z.object({
  id: z.string().uuid(),
  user_a_id: z.string().uuid(),
  user_b_id: z.string().uuid(),
  status: z.enum(['chatting', 'room_proposed', 'housed', 'closed']),
  proposed_by: z.string().uuid().nullable().optional(),
  proposed_room_name: z.string().nullable().optional(),
  room_id: z.string().uuid().nullable().optional(),
  created_at: z.string().datetime(),
});
export type MatchConnection = z.infer<typeof MatchConnectionSchema>;

export const GetUserTrustInputSchema = z.object({
  p_user_id: z.string().uuid(),
});
export type GetUserTrustInput = z.infer<typeof GetUserTrustInputSchema>;

export const UserTrustSchema = z.object({
  score: z.number().int().min(0).max(100),
  level: z.enum(['gold', 'silver', 'bronze', 'new']),
  resolved_count: z.number().int(),
  on_time_rate: z.number().nullable(),
  dispute_count: z.number().int(),
  is_provisional: z.boolean(),
  is_simulated: z.boolean(),
});
export type UserTrust = z.infer<typeof UserTrustSchema>;

// ============================================================
// 6. Realtime Chat
// ============================================================

export const ChatMessageSchema = z.object({
  id: z.number(),
  connection_id: z.string().uuid(),
  sender_id: z.string().uuid(),
  content: z.string().min(1).max(2000),
  created_at: z.string().datetime(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const SendMessageInputSchema = z.object({
  connection_id: z.string().uuid(),
  content: z.string().min(1, 'Nội dung tin nhắn không được để trống').max(2000),
});
export type SendMessageInput = z.infer<typeof SendMessageInputSchema>;

// ============================================================
// 7. Notifications
// ============================================================

export const NotificationLogItemSchema = z.object({
  id: z.number(),
  room_id: z.string().uuid().nullable().optional(),
  recipient_id: z.string().uuid(),
  task_id: z.string().uuid().nullable().optional(),
  level: z.enum(['friendly', 'due', 'sarcastic', 'sos']).nullable().optional(),
  kind: z.enum(['escalation', 'nudge', 'system', 'match']),
  message: z.string(),
  push_status: z.enum(['pending', 'sent', 'failed', 'skipped']),
  is_llm: z.boolean(),
  sent_at: z.string().datetime(),
});
export type NotificationLogItem = z.infer<typeof NotificationLogItemSchema>;

// ============================================================
// 8. Admin Operations & Demo Controls
// ============================================================

export const AdminKPIOverviewSchema = z.object({
  total_users: z.number().int(),
  dau: z.number().int(),
  wau: z.number().int(),
  total_rooms: z.number().int(),
  active_tasks_this_week: z.number().int(),
  on_time_rate: z.number(),
  dispute_rate: z.number(),
  silent_approval_rate: z.number(),
  total_llm_cost_usd: z.number(),
  total_llm_calls_today: z.number().int(),
  fallback_rate: z.number(),
});
export type AdminKPIOverview = z.infer<typeof AdminKPIOverviewSchema>;

export const AdminTimeseriesInputSchema = z.object({
  p_metric: z.enum(['dau', 'tasks_completed', 'matches']),
  p_days: z.number().int().min(1).max(90).default(14),
});
export type AdminTimeseriesInput = z.infer<typeof AdminTimeseriesInputSchema>;

export const AdminTimeseriesPointSchema = z.object({
  date: z.string(),
  value: z.number(),
});
export type AdminTimeseriesPoint = z.infer<typeof AdminTimeseriesPointSchema>;

export const AdminMatchingFunnelSchema = z.object({
  total_registered: z.number().int(),
  profiles_completed: z.number().int(),
  users_swiped: z.number().int(),
  connections_formed: z.number().int(),
  users_chatted: z.number().int(),
  rooms_created_from_match: z.number().int(),
});
export type AdminMatchingFunnel = z.infer<typeof AdminMatchingFunnelSchema>;

export const AdminHouseholdHealthSchema = z.object({
  total_overdue_tasks: z.number().int(),
  total_active_tasks: z.number().int(),
  rooms_health: z.array(z.object({
    room_id: z.string().uuid(),
    room_name: z.string(),
    member_count: z.number().int(),
    open_tasks: z.number().int(),
    completed_tasks: z.number().int(),
  })),
});
export type AdminHouseholdHealth = z.infer<typeof AdminHouseholdHealthSchema>;

export const AdminLLMUsageInputSchema = z.object({
  p_days: z.number().int().min(1).max(30).default(7),
});
export type AdminLLMUsageInput = z.infer<typeof AdminLLMUsageInputSchema>;

export const AdminLLMUsageSchema = z.object({
  total_calls: z.number().int(),
  fallback_calls: z.number().int(),
  fallback_rate: z.number(),
  total_input_tokens: z.number().int(),
  total_output_tokens: z.number().int(),
  avg_latency_ms: z.number(),
  calls_by_purpose: z.record(z.number().int()),
});
export type AdminLLMUsage = z.infer<typeof AdminLLMUsageSchema>;

export const AdminListDisputesInputSchema = z.object({
  p_limit: z.number().int().min(1).max(100).default(50),
});
export type AdminListDisputesInput = z.infer<typeof AdminListDisputesInputSchema>;

export const AdminDisputeItemSchema = z.object({
  dispute_id: z.string().uuid(),
  task_id: z.string().uuid(),
  task_title: z.string(),
  room_id: z.string().uuid(),
  room_name: z.string(),
  raised_by: z.string().uuid(),
  raised_by_name: z.string().nullable().optional(),
  claimed_by: z.string().uuid().nullable().optional(),
  claimed_by_name: z.string().nullable().optional(),
  reason_code: z.string(),
  reason: z.string().nullable().optional(),
  status: z.string(),
  created_at: z.string().datetime(),
});
export type AdminDisputeItem = z.infer<typeof AdminDisputeItemSchema>;

export const AdminCronStatusItemSchema = z.object({
  jobid: z.number().int(),
  jobname: z.string(),
  schedule: z.string(),
  active: z.boolean(),
  last_run: z.object({
    status: z.string().nullable().optional(),
    start_time: z.string().nullable().optional(),
    end_time: z.string().nullable().optional(),
  }).nullable().optional(),
});
export type AdminCronStatusItem = z.infer<typeof AdminCronStatusItemSchema>;

export const AdminDemoForceApproveInputSchema = z.object({
  p_task_id: z.string().uuid(),
});
export type AdminDemoForceApproveInput = z.infer<typeof AdminDemoForceApproveInputSchema>;

export const AdminDemoRunJobInputSchema = z.object({
  p_job: z.enum(['silent_approval', 'escalate', 'expire', 'refresh_features', 'weekly_targets']),
});
export type AdminDemoRunJobInput = z.infer<typeof AdminDemoRunJobInputSchema>;
