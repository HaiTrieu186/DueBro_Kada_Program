import { supabase } from '../../lib/supabase';
import { callRpc } from '../../lib/rpc';
import type { UserTrust } from '@duebro/shared-types';

export interface MatchCandidate {
  candidate_id: string;
  display_name: string;
  avatar_url: string | null;
  compatibility_score: number;
  compatibility_pct: number;
  strengths: string[];
  conflicts: string[];
  lifestyle: any;
  trust: UserTrust | null;
  is_seed_data: boolean;
}

export const matchingApi = {
  getSuggestions: async (userId: string): Promise<MatchCandidate[]> => {
    // 1. Try compute-matches Edge function if available
    try {
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke(
        'compute-matches',
        { body: { limit: 20 } }
      );
      if (!edgeError && edgeData?.suggestions && edgeData.suggestions.length > 0) {
        // Hydrate suggestions
        return edgeData.suggestions;
      }
    } catch {
      // Fallback if local edge function not running
    }

    // 2. Fallback: Query match_suggestions table + profiles_public + lifestyle_profiles
    const { data: suggestions, error: sError } = await supabase
      .from('match_suggestions')
      .select('*')
      .eq('user_id', userId)
      .order('compatibility_score', { ascending: false })
      .limit(20);

    let candidates: any[] = [];
    if (!sError && suggestions && suggestions.length > 0) {
      candidates = suggestions;
    } else {
      // Direct lifestyle_profiles query for development if suggestions haven't been computed yet
      const { data: profiles, error: pError } = await supabase
        .from('lifestyle_profiles')
        .select('*')
        .neq('user_id', userId)
        .limit(15);

      if (pError) throw pError;
      candidates = (profiles || []).map((lp) => ({
        candidate_id: lp.user_id,
        compatibility_score: 0.85,
        breakdown: {},
        reasons: {
          strengths: ['Cùng múi giờ sinh hoạt', 'Mức độ ngăn nắp tương đồng'],
          conflicts: [],
        },
      }));
    }

    const candidateIds = candidates.map((c) => c.candidate_id);
    if (candidateIds.length === 0) return [];

    // Get public profiles
    const { data: profiles } = await supabase
      .from('profiles_public')
      .select('*')
      .in('id', candidateIds);

    // Get lifestyle profiles
    const { data: lifestyles } = await supabase
      .from('lifestyle_profiles')
      .select('*')
      .in('user_id', candidateIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    const lifestyleMap = new Map((lifestyles || []).map((l) => [l.user_id, l]));

    return candidates.map((c) => {
      const p = profileMap.get(c.candidate_id);
      const l = lifestyleMap.get(c.candidate_id);
      const score = Number(c.compatibility_score || 0.8);

      return {
        candidate_id: c.candidate_id,
        display_name: p?.display_name || 'Bro Ẩn Danh',
        avatar_url: p?.avatar_url || null,
        compatibility_score: score,
        compatibility_pct: Math.round(score * 100),
        strengths: c.reasons?.strengths || ['Cùng nhịp sống', 'Ngân sách phù hợp'],
        conflicts: c.reasons?.conflicts || [],
        lifestyle: l || null,
        trust: null,
        is_seed_data: l?.is_seed_data || false,
      };
    });
  },

  getUserTrust: async (userId: string): Promise<UserTrust> => {
    return callRpc<UserTrust>('get_user_trust', { p_user_id: userId });
  },

  swipe: async (candidateId: string, action: 'liked' | 'passed') => {
    return callRpc<{ matched: boolean; connection_id?: string }>('swipe', {
      p_candidate_id: candidateId,
      p_action: action,
    });
  },
};
