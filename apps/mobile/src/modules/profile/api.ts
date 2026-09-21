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
    // 1. Update display name if provided
    if (input.displayName) {
      await profileApi.updateDisplayName(userId, input.displayName);
    }

    // 2. Upsert lifestyle_profiles (chỉ các cột hợp lệ theo migration 016)
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
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
