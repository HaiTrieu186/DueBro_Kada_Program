// supabase/functions/compute-matches/index.ts
// Architecture Reference Section 7.1 & Section 15.6

import { corsHeaders } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabaseClient.ts';
import {
  compatibility,
  passesHardFilters,
  type LifestyleProfile,
} from './scoring.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createAdminClient();

    // 1. Xác thực người dùng hiện tại
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await admin.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const currentUserId = user.id;

    // 2. Lấy hồ sơ lối sống của người dùng hiện tại
    const { data: myProfile, error: myProfileError } = await admin
      .from('lifestyle_profiles')
      .select('*')
      .eq('user_id', currentUserId)
      .single();

    if (myProfileError || !myProfile) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Chưa hoàn thành hồ sơ lối sống',
          code: 'PROFILE_INCOMPLETE',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Lấy danh sách ID đã swipe để loại bỏ khỏi gợi ý
    const { data: swipedActions } = await admin
      .from('match_actions')
      .select('candidate_id')
      .eq('user_id', currentUserId);

    const excludedIds = new Set<string>();
    excludedIds.add(currentUserId);
    (swipedActions || []).forEach((row: { candidate_id: string }) => {
      excludedIds.add(row.candidate_id);
    });

    // 4. Lấy tất cả ứng viên trong cùng thành phố
    const { data: candidates, error: candidateError } = await admin
      .from('lifestyle_profiles')
      .select('*, profiles(id, display_name, avatar_url)')
      .eq('city', myProfile.city);

    if (candidateError) {
      throw candidateError;
    }

    // 5. Chạy bộ lọc và thuật toán so khớp
    const suggestions: Array<{
      candidate_id: string;
      display_name: string;
      avatar_url: string | null;
      compatibility_pct: number;
      matching_reasons: string[];
      consideration: string | null;
      trust_score: number;
      is_seed_data: boolean;
      breakdown: Record<string, number>;
    }> = [];

    const dbSuggestionsToUpsert: Array<{
      user_id: string;
      candidate_id: string;
      compatibility_score: number;
      breakdown: Record<string, number>;
      reasons: { strengths: string[]; considerations: string[] };
      model_version: string;
    }> = [];

    for (const c of candidates || []) {
      if (excludedIds.has(c.user_id)) continue;

      const candidateProfile: LifestyleProfile = c;
      if (!passesHardFilters(myProfile as LifestyleProfile, candidateProfile)) {
        continue;
      }

      const { score, breakdown, reasons } = compatibility(
        myProfile as LifestyleProfile,
        candidateProfile
      );

      const trustScore = c.is_seed_data ? (c.seed_trust_score ?? 85) : 75;
      const profileInfo = c.profiles || {};

      suggestions.push({
        candidate_id: c.user_id,
        display_name: profileInfo.display_name || 'Người dùng Due Bro',
        avatar_url: profileInfo.avatar_url || null,
        compatibility_pct: Math.round(score * 100),
        matching_reasons: reasons.strengths,
        consideration: reasons.considerations[0] || null,
        trust_score: trustScore,
        is_seed_data: !!c.is_seed_data,
        breakdown,
      });

      dbSuggestionsToUpsert.push({
        user_id: currentUserId,
        candidate_id: c.user_id,
        compatibility_score: score,
        breakdown,
        reasons,
        model_version: 'match_v1',
      });
    }

    // Sắp xếp giảm dần theo độ tương thích
    suggestions.sort((a, b) => b.compatibility_pct - a.compatibility_pct);

    // Lưu cache kết quả vào database
    if (dbSuggestionsToUpsert.length > 0) {
      await admin.from('match_suggestions').upsert(dbSuggestionsToUpsert);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        count: suggestions.length,
        suggestions: suggestions.slice(0, 20),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
