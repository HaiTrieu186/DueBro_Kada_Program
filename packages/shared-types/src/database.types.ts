export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          push_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          avatar_url?: string | null;
          push_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_url?: string | null;
          push_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      lifestyle_profiles: {
        Row: {
          user_id: string;
          intent: 'seeking_roommate' | 'has_room';
          city: string;
          district: string | null;
          gender: 'male' | 'female' | 'other' | null;
          gender_pref: 'any' | 'same';
          occupation_type: 'student' | 'worker' | 'freelancer' | 'other';
          wake_up_time: string;
          sleep_time: string;
          budget_min: number;
          budget_max: number;
          tidiness_level: number;
          noise_tolerance: number;
          smokes: boolean;
          has_pet: boolean;
          guest_frequency: 'never' | 'rarely' | 'sometimes' | 'often';
          guest_curfew: string | null;
          bio: string | null;
          is_seed_data: boolean;
          seed_trust_score: number | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          intent?: 'seeking_roommate' | 'has_room';
          city: string;
          district?: string | null;
          gender?: 'male' | 'female' | 'other' | null;
          gender_pref?: 'any' | 'same';
          occupation_type: 'student' | 'worker' | 'freelancer' | 'other';
          wake_up_time: string;
          sleep_time: string;
          budget_min: number;
          budget_max: number;
          tidiness_level: number;
          noise_tolerance: number;
          smokes?: boolean;
          has_pet?: boolean;
          guest_frequency?: 'never' | 'rarely' | 'sometimes' | 'often';
          guest_curfew?: string | null;
          bio?: string | null;
          is_seed_data?: boolean;
          seed_trust_score?: number | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          intent?: 'seeking_roommate' | 'has_room';
          city?: string;
          district?: string | null;
          gender?: 'male' | 'female' | 'other' | null;
          gender_pref?: 'any' | 'same';
          occupation_type?: 'student' | 'worker' | 'freelancer' | 'other';
          wake_up_time?: string;
          sleep_time?: string;
          budget_min?: number;
          budget_max?: number;
          tidiness_level?: number;
          noise_tolerance?: number;
          smokes?: boolean;
          has_pet?: boolean;
          guest_frequency?: 'never' | 'rarely' | 'sometimes' | 'often';
          guest_curfew?: string | null;
          bio?: string | null;
          is_seed_data?: boolean;
          seed_trust_score?: number | null;
          updated_at?: string;
        };
      };
      rooms: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_by: string;
          max_members: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code?: string;
          created_by: string;
          max_members?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          invite_code?: string;
          created_by?: string;
          max_members?: number;
          created_at?: string;
        };
      };
      room_members: {
        Row: {
          room_id: string;
          member_id: string;
          role: 'host' | 'member';
          joined_at: string;
          left_at: string | null;
          away_status: 'active' | 'away';
          away_from: string | null;
          away_to: string | null;
          is_new_member_until: string | null;
        };
        Insert: {
          room_id: string;
          member_id: string;
          role?: 'host' | 'member';
          joined_at?: string;
          left_at?: string | null;
          away_status?: 'active' | 'away';
          away_from?: string | null;
          away_to?: string | null;
          is_new_member_until?: string | null;
        };
        Update: {
          room_id?: string;
          member_id?: string;
          role?: 'host' | 'member';
          joined_at?: string;
          left_at?: string | null;
          away_status?: 'active' | 'away';
          away_from?: string | null;
          away_to?: string | null;
          is_new_member_until?: string | null;
        };
      };
      task_instances: {
        Row: {
          id: string;
          room_id: string;
          source: 'recurring' | 'adhoc' | 'life_deadline';
          template_id: string | null;
          title: string;
          category: string;
          effort_points: number;
          requires_photo: boolean;
          due_at: string;
          status: 'open' | 'claimed' | 'assigned' | 'pending_approval' | 'disputed' | 'completed' | 'expired';
          claimed_by: string | null;
          claimed_at: string | null;
          submitted_at: string | null;
          bonus_multiplier: number;
          assignment_method: string;
          original_owner_id: string | null;
          last_escalation_level: 'friendly' | 'due' | 'sarcastic' | 'sos' | null;
          last_escalated_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          source?: 'recurring' | 'adhoc' | 'life_deadline';
          template_id?: string | null;
          title: string;
          category: string;
          effort_points: number;
          requires_photo?: boolean;
          due_at: string;
          status?: 'open' | 'claimed' | 'assigned' | 'pending_approval' | 'disputed' | 'completed' | 'expired';
          claimed_by?: string | null;
          claimed_at?: string | null;
          submitted_at?: string | null;
          bonus_multiplier?: number;
          assignment_method?: string;
          original_owner_id?: string | null;
          last_escalation_level?: 'friendly' | 'due' | 'sarcastic' | 'sos' | null;
          last_escalated_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          source?: 'recurring' | 'adhoc' | 'life_deadline';
          template_id?: string | null;
          title?: string;
          category?: string;
          effort_points?: number;
          requires_photo?: boolean;
          due_at?: string;
          status?: 'open' | 'claimed' | 'assigned' | 'pending_approval' | 'disputed' | 'completed' | 'expired';
          claimed_by?: string | null;
          claimed_at?: string | null;
          submitted_at?: string | null;
          bonus_multiplier?: number;
          assignment_method?: string;
          original_owner_id?: string | null;
          last_escalation_level?: 'friendly' | 'due' | 'sarcastic' | 'sos' | null;
          last_escalated_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
      point_ledger: {
        Row: {
          id: number;
          room_id: string;
          member_id: string;
          point_type: 'effort_weekly' | 'karma_permanent';
          reason: string;
          amount: number;
          task_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          room_id: string;
          member_id: string;
          point_type: 'effort_weekly' | 'karma_permanent';
          reason: string;
          amount: number;
          task_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          room_id?: string;
          member_id?: string;
          point_type?: 'effort_weekly' | 'karma_permanent';
          reason?: string;
          amount?: number;
          task_id?: string | null;
          created_at?: string;
        };
      };
      match_suggestions: {
        Row: {
          user_id: string;
          candidate_id: string;
          compatibility_score: number;
          breakdown: Json;
          reasons: Json;
          model_version: string;
          computed_at: string;
        };
        Insert: {
          user_id: string;
          candidate_id: string;
          compatibility_score: number;
          breakdown: Json;
          reasons: Json;
          model_version: string;
          computed_at?: string;
        };
        Update: {
          user_id?: string;
          candidate_id?: string;
          compatibility_score?: number;
          breakdown?: Json;
          reasons?: Json;
          model_version?: string;
          computed_at?: string;
        };
      };
      match_actions: {
        Row: {
          user_id: string;
          candidate_id: string;
          action: 'liked' | 'passed';
          created_at: string;
        };
        Insert: {
          user_id: string;
          candidate_id: string;
          action: 'liked' | 'passed';
          created_at?: string;
        };
        Update: {
          user_id?: string;
          candidate_id?: string;
          action?: 'liked' | 'passed';
          created_at?: string;
        };
      };
      match_connections: {
        Row: {
          id: string;
          user_a_id: string;
          user_b_id: string;
          status: 'chatting' | 'room_proposed' | 'housed' | 'closed';
          proposed_by: string | null;
          proposed_room_name: string | null;
          room_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_a_id: string;
          user_b_id: string;
          status?: 'chatting' | 'room_proposed' | 'housed' | 'closed';
          proposed_by?: string | null;
          proposed_room_name?: string | null;
          room_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_a_id?: string;
          user_b_id?: string;
          status?: 'chatting' | 'room_proposed' | 'housed' | 'closed';
          proposed_by?: string | null;
          proposed_room_name?: string | null;
          room_id?: string | null;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: number;
          connection_id: string;
          sender_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          connection_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          connection_id?: string;
          sender_id?: string;
          content?: string;
          created_at?: string;
        };
      };
      notifications_log: {
        Row: {
          id: number;
          room_id: string | null;
          recipient_id: string;
          task_id: string | null;
          level: 'friendly' | 'due' | 'sarcastic' | 'sos' | null;
          kind: 'escalation' | 'nudge' | 'system' | 'match';
          message: string;
          push_status: 'pending' | 'sent' | 'failed' | 'skipped';
          push_attempts: number;
          is_llm: boolean;
          sent_at: string;
        };
        Insert: {
          id?: number;
          room_id?: string | null;
          recipient_id: string;
          task_id?: string | null;
          level?: 'friendly' | 'due' | 'sarcastic' | 'sos' | null;
          kind?: 'escalation' | 'nudge' | 'system' | 'match';
          message: string;
          push_status?: 'pending' | 'sent' | 'failed' | 'skipped';
          push_attempts?: number;
          is_llm?: boolean;
          sent_at?: string;
        };
        Update: {
          id?: number;
          room_id?: string | null;
          recipient_id?: string;
          task_id?: string | null;
          level?: 'friendly' | 'due' | 'sarcastic' | 'sos' | null;
          kind?: 'escalation' | 'nudge' | 'system' | 'match';
          message?: string;
          push_status?: 'pending' | 'sent' | 'failed' | 'skipped';
          push_attempts?: number;
          is_llm?: boolean;
          sent_at?: string;
        };
      };
      llm_usage_log: {
        Row: {
          id: number;
          user_id: string | null;
          purpose: 'bro_message' | 'match_reason' | 'seed_reply' | 'other';
          model: string;
          input_tokens: number | null;
          output_tokens: number | null;
          latency_ms: number | null;
          fallback_used: boolean;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id?: string | null;
          purpose: 'bro_message' | 'match_reason' | 'seed_reply' | 'other';
          model: string;
          input_tokens?: number | null;
          output_tokens?: number | null;
          latency_ms?: number | null;
          fallback_used?: boolean;
          error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string | null;
          purpose?: 'bro_message' | 'match_reason' | 'seed_reply' | 'other';
          model?: string;
          input_tokens?: number | null;
          output_tokens?: number | null;
          latency_ms?: number | null;
          fallback_used?: boolean;
          error?: string | null;
          created_at?: string;
        };
      };
      app_events: {
        Row: {
          id: number;
          user_id: string | null;
          event: string;
          props: Json;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id?: string | null;
          event: string;
          props?: Json;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string | null;
          event?: string;
          props?: Json;
          created_at?: string;
        };
      };
      swap_requests: {
        Row: {
          id: string;
          task_id: string;
          requested_by: string;
          status: string;
          accepted_by: string | null;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          requested_by: string;
          status?: string;
          accepted_by?: string | null;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          requested_by?: string;
          status?: string;
          accepted_by?: string | null;
          accepted_at?: string | null;
          created_at?: string;
        };
      };
      karma_redemptions: {
        Row: {
          id: string;
          member_id: string;
          room_id: string;
          reward_type: string;
          karma_cost: number;
          redeemed_at: string;
          used_at: string | null;
        };
        Insert: {
          id?: string;
          member_id: string;
          room_id: string;
          reward_type: string;
          karma_cost: number;
          redeemed_at?: string;
          used_at?: string | null;
        };
        Update: {
          id?: string;
          member_id?: string;
          room_id?: string;
          reward_type?: string;
          karma_cost?: number;
          redeemed_at?: string;
          used_at?: string | null;
        };
      };
    };
    Views: {
      profiles_public: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          created_at: string;
        };
      };
      disputes_public: {
        Row: {
          id: string;
          task_id: string;
          room_id: string;
          reason_code: string;
          status: string;
          created_at: string;
        };
      };
      nudge_counts: {
        Row: {
          task_id: string;
          room_id: string;
          nudge_count: number;
        };
      };
      weekly_quota_progress: {
        Row: {
          room_id: string;
          member_id: string;
          week_start: string;
          achieved_points: number;
          target_points: number;
        };
      };
    };
    Functions: {
      create_room: {
        Args: { p_name: string };
        Returns: Database['public']['Tables']['rooms']['Row'];
      };
      join_room: {
        Args: { p_invite_code: string };
        Returns: Database['public']['Tables']['rooms']['Row'];
      };
      leave_room: {
        Args: { p_room_id: string; p_new_host_id?: string | null };
        Returns: void;
      };
      create_adhoc_task: {
        Args: {
          p_room_id: string;
          p_title: string;
          p_category: string;
          p_effort_points: number;
          p_due_at: string;
        };
        Returns: Database['public']['Tables']['task_instances']['Row'];
      };
      claim_task: {
        Args: { p_task_id: string };
        Returns: Database['public']['Tables']['task_instances']['Row'];
      };
      submit_task: {
        Args: { p_task_id: string; p_photo_path?: string | null };
        Returns: Database['public']['Tables']['task_instances']['Row'];
      };
      request_nudge: {
        Args: { p_task_id: string };
        Returns: void;
      };
      dispute_task: {
        Args: { p_task_id: string; p_reason_code: string; p_reason?: string | null };
        Returns: Database['public']['Tables']['task_instances']['Row'];
      };
      resolve_dispute: {
        Args: { p_task_id: string; p_decision: string };
        Returns: Database['public']['Tables']['task_instances']['Row'];
      };
      request_swap: {
        Args: { p_task_id: string };
        Returns: Database['public']['Tables']['swap_requests']['Row'];
      };
      accept_swap: {
        Args: { p_swap_id: string };
        Returns: Database['public']['Tables']['task_instances']['Row'];
      };
      cancel_swap: {
        Args: { p_swap_id: string };
        Returns: void;
      };
      set_away_mode: {
        Args: { p_room_id: string; p_from: string; p_to: string };
        Returns: Database['public']['Tables']['room_members']['Row'];
      };
      clear_away_mode: {
        Args: { p_room_id: string };
        Returns: Database['public']['Tables']['room_members']['Row'];
      };
      redeem_karma: {
        Args: { p_room_id: string; p_reward_type: string };
        Returns: Database['public']['Tables']['karma_redemptions']['Row'];
      };
      swipe: {
        Args: { p_candidate_id: string; p_action: string };
        Returns: Json;
      };
      propose_room: {
        Args: { p_connection_id: string; p_room_name: string };
        Returns: Database['public']['Tables']['match_connections']['Row'];
      };
      accept_room: {
        Args: { p_connection_id: string };
        Returns: Database['public']['Tables']['rooms']['Row'];
      };
      get_user_trust: {
        Args: { p_user_id: string };
        Returns: Json;
      };
      track_event: {
        Args: { p_event: string; p_props?: Json };
        Returns: void;
      };
      is_ops: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_room_member: {
        Args: { target_room_id: string };
        Returns: boolean;
      };
      is_connection_member: {
        Args: { target_connection_id: string };
        Returns: boolean;
      };
      admin_kpi_overview: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      admin_timeseries: {
        Args: { p_metric: string; p_days?: number };
        Returns: Json;
      };
      admin_matching_funnel: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      admin_household_health: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      admin_llm_usage: {
        Args: { p_days?: number };
        Returns: Json;
      };
      admin_list_disputes: {
        Args: { p_limit?: number };
        Returns: Json;
      };
      admin_cron_status: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      admin_demo_force_approve: {
        Args: { p_task_id: string };
        Returns: Database['public']['Tables']['task_instances']['Row'];
      };
      admin_demo_run_job: {
        Args: { p_job: string };
        Returns: Json;
      };
    };
  };
}
