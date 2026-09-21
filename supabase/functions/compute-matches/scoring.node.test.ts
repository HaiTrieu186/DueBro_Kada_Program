import test from 'node:test';
import assert from 'node:assert';
import {
  circ,
  passesHardFilters,
  compatibility,
  WEIGHTS,
  type LifestyleProfile,
} from './scoring.ts';

const baseProfile: LifestyleProfile = {
  user_id: '11111111-1111-1111-1111-111111111111',
  city: 'Hồ Chí Minh',
  district: 'Quận 10',
  gender: 'male',
  gender_pref: 'any',
  occupation_type: 'student',
  wake_up_time: '07:00',
  sleep_time: '23:00',
  budget_min: 3000000,
  budget_max: 4500000,
  tidiness_level: 4,
  noise_tolerance: 3,
  smokes: false,
  has_pet: false,
  guest_frequency: 'sometimes',
  guest_curfew: '22:00',
};

test('1. Tổng 10 trọng số phải bằng đúng 1.0', () => {
  const sum = Object.values(WEIGHTS).reduce((acc, w) => acc + w, 0);
  assert(Math.abs(sum - 1.0) < 0.0001, `Tổng trọng số phải là 1, hiện tại là ${sum}`);
});

test('2. Khoảng cách vòng tròn 24h (circ): 23:00 và 01:00 cách nhau đúng 2 giờ', () => {
  const score = circ('23:00', '01:00', 6);
  const expected = 1 - 2 / 6;
  assert(Math.abs(score - expected) < 0.0001, `Mong đợi ${expected}, nhận được ${score}`);
});

test('3. Hai hồ sơ giống hệt nhau phải đạt điểm tuyệt đối 1.0', () => {
  const twinProfile: LifestyleProfile = {
    ...baseProfile,
    user_id: '22222222-2222-2222-2222-222222222222',
  };
  const res = compatibility(baseProfile, twinProfile);
  assert.strictEqual(res.score, 1.0);
  assert.strictEqual(res.breakdown.smokes, 1);
  assert.strictEqual(res.breakdown.pet, 1);
  assert.strictEqual(res.breakdown.budget, 1);
});

test('4. Người hút thuốc vs người không hút thuốc -> smokes = 0', () => {
  const smoker: LifestyleProfile = {
    ...baseProfile,
    user_id: '22222222-2222-2222-2222-222222222222',
    smokes: true,
  };
  const res = compatibility(baseProfile, smoker);
  assert.strictEqual(res.breakdown.smokes, 0);
});

test('5. Hard Filter: Khác thành phố phải bị loại bỏ', () => {
  const hanoiProfile: LifestyleProfile = {
    ...baseProfile,
    user_id: '22222222-2222-2222-2222-222222222222',
    city: 'Hà Nội',
  };
  assert.strictEqual(passesHardFilters(baseProfile, hanoiProfile), false);
});

test('6. Hard Filter: Ngân sách rời nhau hoàn toàn phải bị loại bỏ', () => {
  const richProfile: LifestyleProfile = {
    ...baseProfile,
    user_id: '22222222-2222-2222-2222-222222222222',
    budget_min: 6000000,
    budget_max: 8000000,
  };
  assert.strictEqual(passesHardFilters(baseProfile, richProfile), false);
});

test('7. Hard Filter: gender_pref = same nhưng khác giới phải bị loại bỏ', () => {
  const femaleProfile: LifestyleProfile = {
    ...baseProfile,
    user_id: '22222222-2222-2222-2222-222222222222',
    gender: 'female',
    gender_pref: 'same',
  };
  assert.strictEqual(passesHardFilters(baseProfile, femaleProfile), false);
});

test('8. Thiếu curfew (null) -> tự động bỏ trường và chia lại trọng số', () => {
  const noCurfewA: LifestyleProfile = { ...baseProfile, guest_curfew: null };
  const noCurfewB: LifestyleProfile = {
    ...baseProfile,
    user_id: '22222222-2222-2222-2222-222222222222',
    guest_curfew: null,
  };
  const res = compatibility(noCurfewA, noCurfewB);
  assert.strictEqual(res.score, 1.0);
  assert.strictEqual(res.breakdown.curfew, undefined);
});

test('9. Tính đối xứng: compatibility(A, B) === compatibility(B, A)', () => {
  const partner: LifestyleProfile = {
    user_id: '22222222-2222-2222-2222-222222222222',
    city: 'Hồ Chí Minh',
    gender: 'male',
    gender_pref: 'any',
    occupation_type: 'worker',
    wake_up_time: '06:30',
    sleep_time: '00:00',
    budget_min: 2500000,
    budget_max: 4000000,
    tidiness_level: 3,
    noise_tolerance: 4,
    smokes: false,
    has_pet: true,
    guest_frequency: 'rarely',
    guest_curfew: '23:00',
  };
  const ab = compatibility(baseProfile, partner);
  const ba = compatibility(partner, baseProfile);
  assert.strictEqual(ab.score, ba.score);
});
