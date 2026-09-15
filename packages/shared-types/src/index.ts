export * from './database.types';

// Helper table row types for convenience across apps
import type { Database } from './database.types';

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// Convenience shortcuts
export type Profile = Tables<'profiles'>;
export type Room = Tables<'rooms'>;
export type RoomMember = Tables<'room_members'>;
export type ChoreTemplate = Tables<'chore_templates'>;
export type TaskInstance = Tables<'task_instances'>;
export type TaskEvent = Tables<'task_events'>;
export type TaskPhoto = Tables<'task_photos'>;
export type PointLedger = Tables<'point_ledger'>;
export type WeeklyQuotaTarget = Tables<'weekly_quota_targets'>;
export type KarmaRedemption = Tables<'karma_redemptions'>;
export type BillTemplate = Tables<'bill_templates'>;
export type NotificationLog = Tables<'notifications_log'>;
export type NudgeRequest = Tables<'nudge_requests'>;
export type Dispute = Tables<'disputes'>;
export type SwapRequest = Tables<'swap_requests'>;
export type MlPrediction = Tables<'ml_predictions'>;
