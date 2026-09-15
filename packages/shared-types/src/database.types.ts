export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      bill_templates: {
        Row: {
          created_by: string
          id: string
          is_active: boolean
          name: string
          recurrence_rule: string
          room_id: string
        }
        Insert: {
          created_by: string
          id?: string
          is_active?: boolean
          name: string
          recurrence_rule: string
          room_id: string
        }
        Update: {
          created_by?: string
          id?: string
          is_active?: boolean
          name?: string
          recurrence_rule?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_templates_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chore_templates: {
        Row: {
          approved_by_host: boolean
          category: string
          created_at: string
          created_by: string
          default_effort_points: number
          estimated_minutes: number | null
          id: string
          is_active: boolean
          name: string
          recurrence_rule: string | null
          requires_photo: boolean
          room_id: string
        }
        Insert: {
          approved_by_host?: boolean
          category: string
          created_at?: string
          created_by: string
          default_effort_points: number
          estimated_minutes?: number | null
          id?: string
          is_active?: boolean
          name: string
          recurrence_rule?: string | null
          requires_photo?: boolean
          room_id: string
        }
        Update: {
          approved_by_host?: boolean
          category?: string
          created_at?: string
          created_by?: string
          default_effort_points?: number
          estimated_minutes?: number | null
          id?: string
          is_active?: boolean
          name?: string
          recurrence_rule?: string | null
          requires_photo?: boolean
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chore_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chore_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chore_templates_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          created_at: string
          id: string
          raised_by: string
          reason: string | null
          resolved_at: string | null
          room_id: string
          status: string
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          raised_by: string
          reason?: string | null
          resolved_at?: string | null
          room_id: string
          status?: string
          task_id: string
        }
        Update: {
          created_at?: string
          id?: string
          raised_by?: string
          reason?: string | null
          resolved_at?: string | null
          room_id?: string
          status?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_raised_by_fkey"
            columns: ["raised_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_raised_by_fkey"
            columns: ["raised_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      karma_redemptions: {
        Row: {
          id: string
          karma_cost: number
          member_id: string
          redeemed_at: string
          reward_type: string
          used_at: string | null
        }
        Insert: {
          id?: string
          karma_cost: number
          member_id: string
          redeemed_at?: string
          reward_type: string
          used_at?: string | null
        }
        Update: {
          id?: string
          karma_cost?: number
          member_id?: string
          redeemed_at?: string
          reward_type?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "karma_redemptions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "karma_redemptions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_predictions: {
        Row: {
          candidate_member_id: string
          created_at: string
          id: number
          model_version: string
          rank: number
          score: number
          task_id: string
        }
        Insert: {
          candidate_member_id: string
          created_at?: string
          id?: never
          model_version: string
          rank: number
          score: number
          task_id: string
        }
        Update: {
          candidate_member_id?: string
          created_at?: string
          id?: never
          model_version?: string
          rank?: number
          score?: number
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ml_predictions_candidate_member_id_fkey"
            columns: ["candidate_member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_predictions_candidate_member_id_fkey"
            columns: ["candidate_member_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_predictions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_log: {
        Row: {
          id: number
          level: Database["public"]["Enums"]["escalation_level"] | null
          message: string
          recipient_id: string
          room_id: string
          sent_at: string
          task_id: string | null
        }
        Insert: {
          id?: never
          level?: Database["public"]["Enums"]["escalation_level"] | null
          message: string
          recipient_id: string
          room_id: string
          sent_at?: string
          task_id?: string | null
        }
        Update: {
          id?: never
          level?: Database["public"]["Enums"]["escalation_level"] | null
          message?: string
          recipient_id?: string
          room_id?: string
          sent_at?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_log_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_log_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_log_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      nudge_requests: {
        Row: {
          created_at: string
          id: number
          requester_id: string
          room_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          requester_id: string
          room_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          id?: never
          requester_id?: string
          room_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nudge_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nudge_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nudge_requests_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nudge_requests_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      point_ledger: {
        Row: {
          amount: number
          created_at: string
          id: number
          member_id: string
          point_type: Database["public"]["Enums"]["point_type"]
          reason: Database["public"]["Enums"]["point_reason"]
          room_id: string
          task_id: string | null
          week_start: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: never
          member_id: string
          point_type: Database["public"]["Enums"]["point_type"]
          reason: Database["public"]["Enums"]["point_reason"]
          room_id: string
          task_id?: string | null
          week_start?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: never
          member_id?: string
          point_type?: Database["public"]["Enums"]["point_type"]
          reason?: Database["public"]["Enums"]["point_reason"]
          room_id?: string
          task_id?: string | null
          week_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "point_ledger_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_ledger_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_ledger_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_ledger_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          locale: string | null
          push_token: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id: string
          locale?: string | null
          push_token?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          locale?: string | null
          push_token?: string | null
        }
        Relationships: []
      }
      room_members: {
        Row: {
          away_from: string | null
          away_status: Database["public"]["Enums"]["away_status"]
          away_to: string | null
          is_new_member_until: string | null
          joined_at: string
          karma_score: number
          left_at: string | null
          member_id: string
          role: Database["public"]["Enums"]["member_role"]
          room_id: string
        }
        Insert: {
          away_from?: string | null
          away_status?: Database["public"]["Enums"]["away_status"]
          away_to?: string | null
          is_new_member_until?: string | null
          joined_at?: string
          karma_score?: number
          left_at?: string | null
          member_id: string
          role?: Database["public"]["Enums"]["member_role"]
          room_id: string
        }
        Update: {
          away_from?: string | null
          away_status?: Database["public"]["Enums"]["away_status"]
          away_to?: string | null
          is_new_member_until?: string | null
          joined_at?: string
          karma_score?: number
          left_at?: string | null
          member_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string
          created_by: string
          id: string
          invite_code: string
          is_pro: boolean
          mascot_name: string | null
          max_members: number
          name: string
          reward_contract_text: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          invite_code: string
          is_pro?: boolean
          mascot_name?: string | null
          max_members?: number
          name: string
          reward_contract_text?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          invite_code?: string
          is_pro?: boolean
          mascot_name?: string | null
          max_members?: number
          name?: string
          reward_contract_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      swap_requests: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          id: string
          requested_by: string
          status: string
          task_id: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          id?: string
          requested_by: string
          status?: string
          task_id: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          id?: string
          requested_by?: string
          status?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swap_requests_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swap_requests_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swap_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swap_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swap_requests_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      task_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          id: number
          metadata: Json | null
          task_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          id?: never
          metadata?: Json | null
          task_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          id?: never
          metadata?: Json | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      task_instances: {
        Row: {
          approved_at: string | null
          assignment_method: string | null
          bonus_multiplier: number
          category: string | null
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          created_by: string | null
          due_at: string
          effort_points: number
          id: string
          last_escalation_level:
            | Database["public"]["Enums"]["escalation_level"]
            | null
          opened_at: string
          original_owner_id: string | null
          requires_photo: boolean
          room_id: string
          source: Database["public"]["Enums"]["task_source"]
          status: Database["public"]["Enums"]["task_status"]
          submitted_at: string | null
          template_id: string | null
          title: string
        }
        Insert: {
          approved_at?: string | null
          assignment_method?: string | null
          bonus_multiplier?: number
          category?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          created_by?: string | null
          due_at: string
          effort_points: number
          id?: string
          last_escalation_level?:
            | Database["public"]["Enums"]["escalation_level"]
            | null
          opened_at?: string
          original_owner_id?: string | null
          requires_photo?: boolean
          room_id: string
          source: Database["public"]["Enums"]["task_source"]
          status?: Database["public"]["Enums"]["task_status"]
          submitted_at?: string | null
          template_id?: string | null
          title: string
        }
        Update: {
          approved_at?: string | null
          assignment_method?: string | null
          bonus_multiplier?: number
          category?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          created_by?: string | null
          due_at?: string
          effort_points?: number
          id?: string
          last_escalation_level?:
            | Database["public"]["Enums"]["escalation_level"]
            | null
          opened_at?: string
          original_owner_id?: string | null
          requires_photo?: boolean
          room_id?: string
          source?: Database["public"]["Enums"]["task_source"]
          status?: Database["public"]["Enums"]["task_status"]
          submitted_at?: string | null
          template_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_instances_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_instances_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_instances_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_instances_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_instances_original_owner_id_fkey"
            columns: ["original_owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_instances_original_owner_id_fkey"
            columns: ["original_owner_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_instances_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "chore_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      task_photos: {
        Row: {
          created_at: string
          id: string
          storage_path: string
          task_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          storage_path: string
          task_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          id?: string
          storage_path?: string
          task_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_photos_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_quota_targets: {
        Row: {
          member_id: string
          room_id: string
          target_points: number
          week_start: string
        }
        Insert: {
          member_id: string
          room_id: string
          target_points: number
          week_start: string
        }
        Update: {
          member_id?: string
          room_id?: string
          target_points?: number
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_quota_targets_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_quota_targets_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_quota_targets_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      disputes_public: {
        Row: {
          created_at: string | null
          id: string | null
          resolved_at: string | null
          room_id: string | null
          status: string | null
          task_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          resolved_at?: string | null
          room_id?: string | null
          status?: string | null
          task_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          resolved_at?: string | null
          room_id?: string | null
          status?: string | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disputes_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_member_features: {
        Row: {
          avg_delay_hours: number | null
          away_status: Database["public"]["Enums"]["away_status"] | null
          completion_rate: number | null
          is_new_member_until: string | null
          member_id: string | null
          quota_progress_pct: number | null
          room_id: string | null
          tenure_days: number | null
          total_karma: number | null
        }
        Relationships: [
          {
            foreignKeyName: "room_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      nudge_counts: {
        Row: {
          nudge_count: number | null
          room_id: string | null
          task_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nudge_requests_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nudge_requests_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          id: string | null
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string | null
          id?: string | null
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
      weekly_quota_progress: {
        Row: {
          achieved_points: number | null
          member_id: string | null
          room_id: string | null
          week_start: string | null
        }
        Relationships: [
          {
            foreignKeyName: "point_ledger_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_ledger_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_ledger_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      approve_chore_template: {
        Args: { p_template_id: string }
        Returns: {
          approved_by_host: boolean
          category: string
          created_at: string
          created_by: string
          default_effort_points: number
          estimated_minutes: number | null
          id: string
          is_active: boolean
          name: string
          recurrence_rule: string | null
          requires_photo: boolean
          room_id: string
        }
        SetofOptions: {
          from: "*"
          to: "chore_templates"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      approve_task: { Args: { p_task_id: string }; Returns: undefined }
      claim_task: {
        Args: { p_task_id: string }
        Returns: {
          approved_at: string | null
          assignment_method: string | null
          bonus_multiplier: number
          category: string | null
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          created_by: string | null
          due_at: string
          effort_points: number
          id: string
          last_escalation_level:
            | Database["public"]["Enums"]["escalation_level"]
            | null
          opened_at: string
          original_owner_id: string | null
          requires_photo: boolean
          room_id: string
          source: Database["public"]["Enums"]["task_source"]
          status: Database["public"]["Enums"]["task_status"]
          submitted_at: string | null
          template_id: string | null
          title: string
        }
        SetofOptions: {
          from: "*"
          to: "task_instances"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      dispute_task: {
        Args: { p_reason?: string; p_task_id: string }
        Returns: undefined
      }
      is_room_member: { Args: { target_room_id: string }; Returns: boolean }
      join_room: {
        Args: { p_invite_code: string }
        Returns: {
          away_from: string | null
          away_status: Database["public"]["Enums"]["away_status"]
          away_to: string | null
          is_new_member_until: string | null
          joined_at: string
          karma_score: number
          left_at: string | null
          member_id: string
          role: Database["public"]["Enums"]["member_role"]
          room_id: string
        }
        SetofOptions: {
          from: "*"
          to: "room_members"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      leave_room: {
        Args: { p_new_host_id?: string; p_room_id: string }
        Returns: undefined
      }
      process_silent_approvals: { Args: never; Returns: number }
      propose_chore_template: {
        Args: {
          p_category: string
          p_default_effort_points: number
          p_estimated_minutes: number
          p_name: string
          p_recurrence_rule: string
          p_requires_photo: boolean
          p_room_id: string
        }
        Returns: {
          approved_by_host: boolean
          category: string
          created_at: string
          created_by: string
          default_effort_points: number
          estimated_minutes: number | null
          id: string
          is_active: boolean
          name: string
          recurrence_rule: string | null
          requires_photo: boolean
          room_id: string
        }
        SetofOptions: {
          from: "*"
          to: "chore_templates"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      refresh_member_features: { Args: never; Returns: undefined }
      request_nudge: { Args: { p_task_id: string }; Returns: undefined }
      reset_expired_away_status: { Args: never; Returns: number }
      submit_task: {
        Args: { p_photo_path?: string; p_task_id: string }
        Returns: {
          approved_at: string | null
          assignment_method: string | null
          bonus_multiplier: number
          category: string | null
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          created_by: string | null
          due_at: string
          effort_points: number
          id: string
          last_escalation_level:
            | Database["public"]["Enums"]["escalation_level"]
            | null
          opened_at: string
          original_owner_id: string | null
          requires_photo: boolean
          room_id: string
          source: Database["public"]["Enums"]["task_source"]
          status: Database["public"]["Enums"]["task_status"]
          submitted_at: string | null
          template_id: string | null
          title: string
        }
        SetofOptions: {
          from: "*"
          to: "task_instances"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      away_status: "active" | "away"
      escalation_level: "friendly" | "due" | "sarcastic" | "sos"
      member_role: "host" | "member"
      point_reason:
        | "task_base"
        | "volunteer_bonus"
        | "sos_rescue_bonus"
        | "swap_karma_bonus"
        | "weekly_reset"
        | "manual_adjustment"
        | "penalty"
      point_type: "effort_weekly" | "karma_permanent"
      task_source: "recurring" | "adhoc" | "life_deadline"
      task_status:
        | "open"
        | "claimed"
        | "assigned"
        | "pending_approval"
        | "disputed"
        | "completed"
        | "expired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      away_status: ["active", "away"],
      escalation_level: ["friendly", "due", "sarcastic", "sos"],
      member_role: ["host", "member"],
      point_reason: [
        "task_base",
        "volunteer_bonus",
        "sos_rescue_bonus",
        "swap_karma_bonus",
        "weekly_reset",
        "manual_adjustment",
        "penalty",
      ],
      point_type: ["effort_weekly", "karma_permanent"],
      task_source: ["recurring", "adhoc", "life_deadline"],
      task_status: [
        "open",
        "claimed",
        "assigned",
        "pending_approval",
        "disputed",
        "completed",
        "expired",
      ],
    },
  },
} as const
