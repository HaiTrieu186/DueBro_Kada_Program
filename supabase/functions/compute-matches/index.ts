// supabase/functions/compute-matches/index.ts
// Architecture Reference: Section 7.1, MATCHING_ENGINE_SPEC.md
//
// Bug B2 fix: response shape đúng với mobile interface MatchCandidate
//   matching_reasons → strengths (string[])
//   consideration   → conflicts  (string[])
//   + compatibility_score (0..1), lifestyle: null, trust: null
//
// Cache strategy: TTL 24h — skip recalculation nếu cache còn hiệu lực

import { corsHeaders } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabaseClient.ts';
import {
  compatibility,
  passesHardFilters,
  type LifestyleProfile,
} from './scoring.ts';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const CACHE_TTL_HOURS = 24;
const MODEL_VERSION = 'match_v1';

Deno.serve(async (req: Request) => {
  // ── CORS preflight ───────────────────────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ ok: false, error: 'Method not allowed' }, 405);
  }

  try {
    // ── 1. Auth ──────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ ok: false, error: 'UNAUTHORIZED', message: 'Missing Authorization header' }, 401);
    }

    const admin = createAdminClient();
    const token = authHeader.replace('Bearer ', '').trim();

    const { data: { user }, error: userError } = await admin.auth.getUser(token);
    if (userError || !user) {
      return json({ ok: false, error: 'UNAUTHORIZED', message: 'Invalid token' }, 401);
    }

    const callerId = user.id;

    // ── 2. Parse & validate request body ────────────────────────────────────
    let rawBody: Record<string, unknown> = {};
    try {
      rawBody = await req.json();
    } catch {
      // body trống hoặc không phải JSON → dùng default
    }

    const rawLimit = rawBody.limit;
    const limit =
      typeof rawLimit === 'number' && Number.isInteger(rawLimit) && rawLimit > 0
        ? Math.min(rawLimit, MAX_LIMIT)
        : DEFAULT_LIMIT;

    // ── 3. Lấy hồ sơ caller ─────────────────────────────────────────────────
    const { data: myProfile, error: myProfileError } = await admin
      .from('lifestyle_profiles')
      .select('*')
      .eq('user_id', callerId)
      .single();

    if (myProfileError || !myProfile) {
      const missingFields = validateRequiredFields(myProfile);
      return json(
        {
          ok: false,
          error: 'INCOMPLETE_PROFILE',
          message: 'Hãy hoàn thành hồ sơ lối sống trước khi xem gợi ý',
          missing_fields: missingFields,
        },
        400
      );
    }

    // Validate các trường bắt buộc
    const missingFields = validateRequiredFields(myProfile);
    if (missingFields.length > 0) {
      return json({ ok: false, error: 'INCOMPLETE_PROFILE', missing_fields: missingFields }, 400);
    }

    // ── 4. Lấy ID đã swipe để loại khỏi gợi ý ──────────────────────────────
    const { data: swipedActions } = await admin
      .from('match_actions')
      .select('candidate_id')
      .eq('user_id', callerId);

    const excludedIds = new Set<string>();
    excludedIds.add(callerId);
    for (const row of swipedActions || []) {
      excludedIds.add((row as { candidate_id: string }).candidate_id);
    }

    // ── 5. Lấy cache còn hiệu lực (< 24h) ──────────────────────────────────
    const cacheThreshold = new Date(Date.now() - CACHE_TTL_HOURS * 3600 * 1000).toISOString();
    const { data: cachedRows } = await admin
      .from('match_suggestions')
      .select('candidate_id, compatibility_score, breakdown, reasons, computed_at')
      .eq('user_id', callerId)
      .gte('computed_at', cacheThreshold);

    const cacheMap = new Map<string, {
      compatibility_score: number;
      breakdown: Record<string, number>;
      reasons: { strengths: string[]; considerations: string[] };
    }>();
    for (const row of cachedRows || []) {
      const r = row as {
        candidate_id: string;
        compatibility_score: number;
        breakdown: Record<string, number>;
        reasons: { strengths: string[]; considerations: string[] };
      };
      cacheMap.set(r.candidate_id, {
        compatibility_score: r.compatibility_score,
        breakdown: r.breakdown,
        reasons: r.reasons,
      });
    }

    // ── 6. Lấy tất cả ứng viên cùng thành phố ───────────────────────────────
    const { data: candidates, error: candidateError } = await admin
      .from('lifestyle_profiles')
      .select('*, profiles(id, display_name, avatar_url)')
      .eq('city', myProfile.city);

    if (candidateError) throw candidateError;

    // ── 7. Filter + Score ────────────────────────────────────────────────────
    type SuggestionRow = {
      candidate_id: string;
      display_name: string;
      avatar_url: string | null;
      compatibility_score: number;   // 0..1
      compatibility_pct: number;     // 0..100
      strengths: string[];
      conflicts: string[];
      lifestyle: null;
      trust: null;
      is_seed_data: boolean;
      breakdown: Record<string, number>;
    };

    const suggestions: SuggestionRow[] = [];
    const toUpsert: Array<{
      user_id: string;
      candidate_id: string;
      compatibility_score: number;
      breakdown: Record<string, number>;
      reasons: { strengths: string[]; considerations: string[] };
      model_version: string;
      computed_at: string;
    }> = [];

    const now = new Date().toISOString();

    for (const c of candidates || []) {
      const candidateId: string = c.user_id;
      if (excludedIds.has(candidateId)) continue;

      const candidateProfile = c as unknown as LifestyleProfile;
      if (!passesHardFilters(myProfile as unknown as LifestyleProfile, candidateProfile)) continue;

      // Dùng cache nếu còn hiệu lực
      const cached = cacheMap.get(candidateId);
      let score: number;
      let breakdown: Record<string, number>;
      let reasons: { strengths: string[]; considerations: string[] };

      if (cached) {
        score = cached.compatibility_score;
        breakdown = cached.breakdown;
        reasons = cached.reasons;
      } else {
        const result = compatibility(myProfile as unknown as LifestyleProfile, candidateProfile);
        score = result.score;
        breakdown = result.breakdown;
        reasons = result.reasons;

        toUpsert.push({
          user_id: callerId,
          candidate_id: candidateId,
          compatibility_score: score,
          breakdown,
          reasons,
          model_version: MODEL_VERSION,
          computed_at: now,
        });
      }

      const profileInfo = (c.profiles || {}) as { display_name?: string; avatar_url?: string | null };

      suggestions.push({
        candidate_id: candidateId,
        display_name: profileInfo.display_name || 'Người dùng Due Bro',
        avatar_url: profileInfo.avatar_url ?? null,
        compatibility_score: score,                          // 0..1
        compatibility_pct: Math.round(score * 100),          // 0..100
        strengths: reasons.strengths,                        // Bug B2 fix: đổi từ matching_reasons
        conflicts: reasons.considerations,                   // Bug B2 fix: đổi từ consideration (string → string[])
        lifestyle: null,                                     // mobile tự query nếu cần
        trust: null,                                         // mobile dùng RPC get_user_trust() riêng
        is_seed_data: !!c.is_seed_data,
        breakdown,
      });
    }

    // ── 8. Sort + limit ─────────────────────────────────────────────────────
    suggestions.sort((a, b) => b.compatibility_pct - a.compatibility_pct);
    const paginated = suggestions.slice(0, limit);

    // ── 9. Persist cache cho các bản ghi mới tính ───────────────────────────
    if (toUpsert.length > 0) {
      // Bất đồng bộ — không chặn response
      admin
        .from('match_suggestions')
        .upsert(toUpsert, { onConflict: 'user_id,candidate_id' })
        .then(({ error }) => {
          if (error) console.error('[compute-matches] cache upsert error:', error.message);
        });
    }

    // ── 10. Response ─────────────────────────────────────────────────────────
    return json({
      ok: true,
      count: paginated.length,
      total_candidates_scored: suggestions.length,
      model_version: MODEL_VERSION,
      suggestions: paginated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[compute-matches] unexpected error:', message);
    return json({ ok: false, error: 'INTERNAL_ERROR', message }, 500);
  }
});

// ── Helpers ─────────────────────────────────────────────────────────────────

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Kiểm tra các trường bắt buộc tối thiểu để chạy matching.
 * Trả về danh sách tên field còn thiếu/null.
 */
function validateRequiredFields(profile: Record<string, unknown> | null): string[] {
  if (!profile) return ['profile'];
  const required = [
    'city', 'budget_min', 'budget_max',
    'wake_up_time', 'sleep_time',
    'tidiness_level', 'noise_tolerance',
    'smokes', 'has_pet',
    'guest_frequency', 'gender_pref', 'occupation_type',
  ];
  return required.filter(
    (k) => profile[k] === null || profile[k] === undefined || profile[k] === ''
  );
}
