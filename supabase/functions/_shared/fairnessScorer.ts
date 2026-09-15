// Rule-based Auto-Assign Fairness Scorer (Architecture Section 5.2 - Tier 1)
// Weighted Fairness Score formula:
// score(member, task) =
//     w1 * (1 - current_quota_ratio)        -- ai còn xa target tuần -> ưu tiên
//   + w2 * category_reliability             -- tỉ lệ hoàn thành đúng hạn
//   + w3 * recency_penalty                  -- vừa được gán gần đây -> giảm điểm
//   - w4 * is_new_member_bonus_exclusion   -- tân binh giảm ưu tiên việc nặng (>=30 pts)

export const FAIRNESS_WEIGHTS = {
  w1_quota_distance: 0.4,
  w2_reliability: 0.3,
  w3_recency: 0.2,
  w4_rookie_heavy_chore: 0.1,
} as const;

export const HEAVY_CHORE_EFFORT_THRESHOLD = 30;

export interface MemberCandidateFeature {
  member_id: string;
  room_id: string;
  quota_progress_pct: number | null; // e.g. 0.5 (50%)
  completion_rate: number | null;     // e.g. 0.85 (85%)
  avg_delay_hours: number | null;
  total_karma: number | null;
  away_status: string;
  is_new_member_until: string | null;
  tenure_days: number | null;
  last_assigned_hours_ago?: number | null;
}

export interface CandidateScoreResult {
  member_id: string;
  score: number;
  breakdown: {
    quota_component: number;
    reliability_component: number;
    recency_component: number;
    rookie_penalty_component: number;
  };
}

export function calculateWeightedFairnessScore(
  candidate: MemberCandidateFeature,
  taskEffortPoints: number
): CandidateScoreResult {
  const { w1_quota_distance, w2_reliability, w3_recency, w4_rookie_heavy_chore } = FAIRNESS_WEIGHTS;

  // 1. Quota distance: (1 - current_quota_ratio)
  const quotaRatio = candidate.quota_progress_pct ? Math.min(Math.max(candidate.quota_progress_pct, 0), 1) : 0;
  const quotaComponent = w1_quota_distance * (1 - quotaRatio);

  // 2. Reliability: completion rate
  const reliability = candidate.completion_rate !== null ? Math.min(Math.max(candidate.completion_rate, 0), 1) : 0.7; // default 0.7 baseline
  const reliabilityComponent = w2_reliability * reliability;

  // 3. Recency penalty: if assigned recently (< 24 hours ago), apply penalty
  let recencyComponent = w3_recency;
  if (candidate.last_assigned_hours_ago !== null && candidate.last_assigned_hours_ago !== undefined) {
    if (candidate.last_assigned_hours_ago < 24) {
      // Reduce score proportional to how recently they were assigned
      recencyComponent = w3_recency * (candidate.last_assigned_hours_ago / 24);
    }
  }

  // 4. Rookie exclusion on heavy chore (effort_points >= 30)
  let rookiePenaltyComponent = 0;
  const isRookie = candidate.is_new_member_until ? new Date(candidate.is_new_member_until).getTime() > Date.now() : false;
  if (isRookie && taskEffortPoints >= HEAVY_CHORE_EFFORT_THRESHOLD) {
    rookiePenaltyComponent = w4_rookie_heavy_chore;
  }

  const finalScore = Number(
    (quotaComponent + reliabilityComponent + recencyComponent - rookiePenaltyComponent).toFixed(4)
  );

  return {
    member_id: candidate.member_id,
    score: Math.max(finalScore, 0),
    breakdown: {
      quota_component: quotaComponent,
      reliability_component: reliabilityComponent,
      recency_component: recencyComponent,
      rookie_penalty_component: rookiePenaltyComponent,
    },
  };
}

/**
 * Score and rank a list of candidates descending by score
 */
export function rankCandidatesRuleBased(
  candidates: MemberCandidateFeature[],
  taskEffortPoints: number
): CandidateScoreResult[] {
  const scored = candidates.map((candidate) => calculateWeightedFairnessScore(candidate, taskEffortPoints));
  return scored.sort((a, b) => b.score - a.score);
}
