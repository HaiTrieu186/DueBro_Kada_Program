import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') return null;
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Type-safe RPC helpers (Client NEVER writes directly to business tables)
 * ARCH Mục 9.1 & duebro-supabase-security
 */
export const api = {
  // Matching RPCs
  swipe: async (targetUserId: string, action: 'like' | 'pass') => {
    const { data, error } = await supabase.rpc('swipe', {
      p_target_user_id: targetUserId,
      p_action: action,
    });
    if (error) throw error;
    return data;
  },

  proposeRoom: async (connectionId: string, roomName: string) => {
    const { data, error } = await supabase.rpc('propose_room', {
      p_connection_id: connectionId,
      p_room_name: roomName,
    });
    if (error) throw error;
    return data;
  },

  acceptRoom: async (proposalId: string) => {
    const { data, error } = await supabase.rpc('accept_room', {
      p_proposal_id: proposalId,
    });
    if (error) throw error;
    return data;
  },

  // Chore & Bounty RPCs
  claimTask: async (taskInstanceId: string) => {
    const { data, error } = await supabase.rpc('claim_task', {
      p_task_instance_id: taskInstanceId,
    });
    if (error) throw error;
    return data;
  },

  submitProof: async (taskInstanceId: string, proofPhotoUrl: string) => {
    const { data, error } = await supabase.rpc('submit_proof', {
      p_task_instance_id: taskInstanceId,
      p_proof_photo_url: proofPhotoUrl,
    });
    if (error) throw error;
    return data;
  },

  disputeTask: async (taskInstanceId: string, reasonCode: string, note?: string) => {
    const { data, error } = await supabase.rpc('dispute_task', {
      p_task_instance_id: taskInstanceId,
      p_reason_code: reasonCode,
      p_note: note || null,
    });
    if (error) throw error;
    return data;
  },

  createSosSwap: async (taskInstanceId: string, targetUserId: string, bonusPoints: number, message?: string) => {
    const { data, error } = await supabase.rpc('create_sos_swap', {
      p_task_instance_id: taskInstanceId,
      p_target_user_id: targetUserId,
      p_bonus_points: bonusPoints,
      p_message: message || null,
    });
    if (error) throw error;
    return data;
  },
};
