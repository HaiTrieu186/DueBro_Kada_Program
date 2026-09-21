import { supabase } from '../../lib/supabase';
import type { LifestyleProfileInput } from '@duebro/shared-types';

export const profileApi = {
  getMyProfile: async (userId: string) => {
    const { data: profile, error: pError } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, push_token')
      .eq('id', userId)
      .single();

    if (pError) throw pError;

    const { data: lifestyle } = await supabase
      .from('lifestyle_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    return {
      profile,
      lifestyle,
    };
  },

  updateDisplayName: async (userId: string, displayName: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  saveLifestyleProfile: async (userId: string, input: LifestyleProfileInput & { displayName?: string }) => {
    // 1. Ưu tiên gọi RPC save_lifestyle_profile (chuẩn kiến trúc Due Bro: atomic, SECURITY DEFINER)
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('save_lifestyle_profile', {
        p_intent: input.intent || 'seeking_roommate',
        p_city: input.city,
        p_district: input.district || null,
        p_gender: input.gender || null,
        p_gender_pref: input.gender_pref || 'any',
        p_occupation_type: input.occupation_type,
        p_wake_up_time: input.wake_up_time,
        p_sleep_time: input.sleep_time,
        p_budget_min: input.budget_min,
        p_budget_max: input.budget_max,
        p_tidiness_level: input.tidiness_level,
        p_noise_tolerance: input.noise_tolerance,
        p_smokes: !!input.smokes,
        p_has_pet: !!input.has_pet,
        p_guest_frequency: input.guest_frequency || 'sometimes',
        p_guest_curfew: input.guest_curfew || null,
        p_bio: input.bio || null,
        p_display_name: input.displayName ? input.displayName.trim() : null,
      });

      if (!rpcError && rpcData) {
        // Track event theo ARCH Mục 10 (chạy nền, không chặn flow)
        Promise.resolve(supabase.rpc('track_event', { p_event: 'profile_saved' })).catch(() => {});
        return rpcData;
      }

      if (rpcError) {
        console.warn('RPC save_lifestyle_profile failed, falling back to direct upsert:', rpcError.message);
      }
    } catch (rpcErr) {
      console.warn('RPC save_lifestyle_profile exception, falling back to direct upsert:', rpcErr);
    }

    // 2. Fallback: Nếu RPC chưa sẵn sàng trên backend, thực hiện cập nhật trực tiếp
    if (input.displayName) {
      await profileApi.updateDisplayName(userId, input.displayName);
    }

    const { data, error } = await supabase
      .from('lifestyle_profiles')
      .upsert({
        user_id: userId,
        intent: input.intent || 'seeking_roommate',
        city: input.city,
        district: input.district || null,
        gender: input.gender || null,
        gender_pref: input.gender_pref || 'any',
        occupation_type: input.occupation_type,
        wake_up_time: input.wake_up_time,
        sleep_time: input.sleep_time,
        budget_min: input.budget_min,
        budget_max: input.budget_max,
        tidiness_level: input.tidiness_level,
        noise_tolerance: input.noise_tolerance,
        smokes: !!input.smokes,
        has_pet: !!input.has_pet,
        guest_frequency: input.guest_frequency || 'sometimes',
        guest_curfew: input.guest_curfew || null,
        bio: input.bio || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
