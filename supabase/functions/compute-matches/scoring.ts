// supabase/functions/compute-matches/scoring.ts
// Architecture Reference Section 7.1 & 15.6

export interface LifestyleProfile {
  user_id: string;
  city: string;
  district?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  gender_pref: 'any' | 'same';
  occupation_type: 'student' | 'worker' | 'freelancer' | 'other';
  wake_up_time: string; // "HH:MM"
  sleep_time: string;   // "HH:MM"
  budget_min: number;
  budget_max: number;
  tidiness_level: number; // 1-5
  noise_tolerance: number; // 1-5
  smokes: boolean;
  has_pet: boolean;
  guest_frequency: 'never' | 'rarely' | 'sometimes' | 'often';
  guest_curfew?: string | null; // "HH:MM" or null
}

export const WEIGHTS = {
  wake: 0.08,
  sleep: 0.12,
  tidiness: 0.20,
  noise: 0.12,
  budget: 0.18,
  smokes: 0.10,
  pet: 0.05,
  guest_freq: 0.06,
  curfew: 0.04,
  occupation: 0.05,
} as const;

export type DimensionKey = keyof typeof WEIGHTS;

const toH = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return h + (m || 0) / 60;
};

// Khoảng cách vòng tròn 24h: 23:00 và 01:00 cách nhau 2h, không phải 22h
export const circ = (a: string, b: string, T: number): number => {
  const d0 = Math.abs(toH(a) - toH(b));
  const d = Math.min(d0, 24 - d0);
  return Math.max(0, 1 - d / T);
};

const ordinal = (a: number, b: number, max: number): number => {
  return 1 - Math.abs(a - b) / max;
};

const GUEST_MAP = {
  never: 0,
  rarely: 1,
  sometimes: 2,
  often: 3,
} as const;

export const budgetScore = (a: LifestyleProfile, b: LifestyleProfile): number => {
  const wA = Math.max(a.budget_max - a.budget_min, 500_000);
  const wB = Math.max(b.budget_max - b.budget_min, 500_000);
  const overlap = Math.max(0, Math.min(a.budget_max, b.budget_max) - Math.max(a.budget_min, b.budget_min));
  return Math.min(1, overlap / Math.min(wA, wB));
};

export function passesHardFilters(a: LifestyleProfile, b: LifestyleProfile): boolean {
  // 1. Không tự so với chính mình
  if (a.user_id === b.user_id) return false;
  // 2. Phải cùng thành phố
  if (a.city.trim().toLowerCase() !== b.city.trim().toLowerCase()) return false;
  // 3. Phù hợp giới tính
  const ok = (x: LifestyleProfile, y: LifestyleProfile) =>
    x.gender_pref === 'any' || (x.gender != null && x.gender === y.gender);
  if (!ok(a, b) || !ok(b, a)) return false;
  // 4. Ngân sách có giao nhau
  return Math.max(a.budget_min, b.budget_min) <= Math.min(a.budget_max, b.budget_max);
}

export interface CompatibilityResult {
  score: number; // 0..1
  breakdown: Record<string, number>;
  reasons: {
    strengths: string[];
    considerations: string[];
  };
}

export function compatibility(a: LifestyleProfile, b: LifestyleProfile): CompatibilityResult {
  const s: Record<string, number> = {
    wake: circ(a.wake_up_time, b.wake_up_time, 6),
    sleep: circ(a.sleep_time, b.sleep_time, 6),
    tidiness: ordinal(a.tidiness_level, b.tidiness_level, 4),
    noise: ordinal(a.noise_tolerance, b.noise_tolerance, 4),
    budget: budgetScore(a, b),
    smokes: a.smokes === b.smokes ? 1 : 0,
    pet: a.has_pet === b.has_pet ? 1 : 0,
    guest_freq: ordinal(GUEST_MAP[a.guest_frequency], GUEST_MAP[b.guest_frequency], 3),
    occupation: a.occupation_type === b.occupation_type ? 1 : 0.5,
  };

  // guest_curfew: nếu cả hai cùng có thì tính, nếu thiếu thì bỏ và chia lại trọng số
  if (a.guest_curfew && b.guest_curfew) {
    s.curfew = circ(a.guest_curfew, b.guest_curfew, 3);
  }

  let num = 0;
  let den = 0;
  for (const k in s) {
    const weight = (WEIGHTS as Record<string, number>)[k] || 0;
    num += weight * s[k];
    den += weight;
  }

  const finalScore = den > 0 ? num / den : 0;
  const reasons = extractReasons(a, b, s);

  return {
    score: Math.round(finalScore * 100) / 100,
    breakdown: s,
    reasons,
  };
}

export function extractReasons(
  a: LifestyleProfile,
  b: LifestyleProfile,
  s: Record<string, number>
): { strengths: string[]; considerations: string[] } {
  const descriptions: Record<string, { high: string; low: string }> = {
    sleep: {
      high: 'Giờ giấc sinh hoạt và đi ngủ tương đồng',
      low: 'Chênh lệch giờ ngủ (một người cú đêm, một người ngủ sớm)',
    },
    wake: {
      high: 'Khung giờ thức dậy buổi sáng rất khớp nhau',
      low: 'Lệch giờ thức dậy buổi sáng',
    },
    tidiness: {
      high: 'Tiêu chuẩn giữ gìn vệ sinh và ngăn nắp cực kỳ hợp nhau',
      low: 'Khác biệt về mức độ gọn gàng trong sinh hoạt chung',
    },
    noise: {
      high: 'Mức độ chịu đựng tiếng ồn và sở thích yên tĩnh tương đồng',
      low: 'Khác biệt về thói quen bật nhạc hoặc nói chuyện trong phòng',
    },
    budget: {
      high: 'Khung ngân sách chi trả tiền phòng trùng khớp tối ưu',
      low: 'Khoảng ngân sách giao nhau khá hẹp',
    },
    smokes: {
      high: a.smokes ? 'Cả hai đều hút thuốc' : 'Cả hai đều không hút thuốc (không gian trong lành)',
      low: 'Một người hút thuốc và một người không hút thuốc',
    },
    pet: {
      high: a.has_pet ? 'Cả hai đều yêu thích và nuôi thú cưng' : 'Cả hai đều không nuôi thú cưng',
      low: 'Khác biệt về việc có nuôi thú cưng trong phòng',
    },
    guest_freq: {
      high: 'Quan điểm đón bạn bè về phòng tương đồng',
      low: 'Khác biệt về tần suất rủ bạn bè về phòng chơi',
    },
  };

  const sortedKeys = Object.keys(s)
    .filter((k) => descriptions[k])
    .sort((k1, k2) => s[k2] - s[k1]);

  const strengths: string[] = [];
  const considerations: string[] = [];

  // Lấy top 2 điểm cao nhất
  for (const k of sortedKeys) {
    if (s[k] >= 0.75 && strengths.length < 2) {
      strengths.push(descriptions[k].high);
    }
  }
  if (strengths.length === 0 && sortedKeys.length > 0) {
    strengths.push(descriptions[sortedKeys[0]].high);
  }

  // Lấy 1 điểm thấp nhất làm điểm lưu ý
  const lowestKey = sortedKeys[sortedKeys.length - 1];
  if (lowestKey && s[lowestKey] < 0.75) {
    considerations.push(descriptions[lowestKey].low);
  }

  return { strengths, considerations };
}
