# ĐẶC TẢ KỸ THUẬT — MODULE MATCHING ENGINE (`match_v1`)

> **Dành cho:** Agent lập trình phụ trách module AI Matching.
> **Không dành cho:** Người đọc thông thường — đây là hợp đồng kỹ thuật (contract), không phải tài liệu giới thiệu sản phẩm.
> **Đọc trước:** [`AI_MODULE_IO_SPEC.md`](./AI_MODULE_IO_SPEC.md) — Mục 0 (quy tắc chung) và Mục 2 (trạng thái hiện tại) vẫn là nguồn sự thật cấp cao. File này **bổ sung thêm chi tiết**, không thay thế.
> **Ngày soạn:** 2026-09-28

---

## 0. Đọc trước khi code

### 0.1 Ranh giới sở hữu (module này)

| Bạn AI **được sửa** | Bạn AI **KHÔNG được sửa** |
|---|---|
| `supabase/functions/compute-matches/index.ts` | `apps/mobile/**` |
| `supabase/functions/compute-matches/scoring.ts` (**chỉ phần response build**, không sửa thuật toán) | `apps/admin/**` |
| `supabase/functions/compute-matches/scoring.test.ts` (nếu thêm test case mới) | Migration `001`–`015`, `017`, `019` (đã chạy) |
| `packages/shared-types/src/api-contracts.ts` (phần `MatchSuggestionItemSchema`, `ComputeMatchesResponseSchema`) | `supabase/functions/_shared/fairnessScorer.ts` (thuộc Auto-Assign) |
| `supabase/migrations/20260101000016_matching.sql` và migrations mới do AI tạo | Bất kỳ file nào khác ngoài phạm vi Matching Engine |

### 0.2 Trạng thái module

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Thuật toán Gower-like scoring | ✅ Xong — `scoring.ts` | Không cần sửa, test đã pass |
| Filter cứng (city / gender / budget) | ✅ Xong — `scoring.ts` | Không cần sửa |
| Circular distance `circ()` (giờ ngủ/thức) | ✅ Xong — `scoring.ts` | Test case đã đúng |
| Ghi cache `match_suggestions` | ✅ Xong — `index.ts` | Format DB đúng |
| **Response shape cho mobile** | ❌ Chưa đúng — Bug B2, B3 | Xem Mục 3 |
| Zod schema `ComputeMatchesResponseSchema` | ❌ Không khớp thực tế — Bug B3 | Xem Mục 5 |
| Phân trang (limit/offset) | ⚠️ Chỉ có `limit`, chưa có `offset`/cursor | P2 — không chặn MVP |
| Cache invalidation khi profile thay đổi | ⚠️ Chưa có — cache chỉ expire theo TTL | P2 |

---

## 1. Luồng hoạt động tổng quan

```
User mở màn Discover
        │
        ▼
Mobile gọi POST /functions/v1/compute-matches
        │  body: { limit: 20 }
        │  header: Authorization: Bearer <user_jwt>
        │
        ▼
Edge Function: compute-matches/index.ts
        │
        ├─► [1] Auth — xác thực JWT, lấy caller_id
        │
        ├─► [2] Đọc profile caller từ lifestyle_profiles
        │       (thành phố, giới tính, ngân sách, giờ ngủ/thức, thói quen...)
        │
        ├─► [3] Đọc danh sách ứng viên tiềm năng
        │       (lifestyle_profiles khác caller, đã hoàn thiện profile)
        │
        ├─► [4] Filter cứng — loại bỏ ngay nếu:
        │       - Khác thành phố (city mismatch)
        │       - Giới tính không khớp preference
        │       - Ngân sách thuê phòng lệch quá ngưỡng
        │
        ├─► [5] Tính điểm compatibility từng ứng viên còn lại
        │       (scoring.ts — Gower-like weighted distance, xem Mục 2)
        │
        ├─► [6] Sort giảm dần theo score, lấy top `limit`
        │
        ├─► [7] Sinh matching_reasons từ breakdown điểm
        │       (các chiều score cao → strengths, thấp → considerations)
        │
        ├─► [8] Ghi cache vào bảng match_suggestions
        │       (format DB: reasons jsonb = { strengths: [...], considerations: [...] })
        │
        └─► [9] Trả response cho mobile
                (sau khi vá Bug B2: shape đúng với interface MatchCandidate)
```

---

## 2. Thuật toán Scoring (`scoring.ts`)

> **Không sửa file này** (trừ khi có yêu cầu rõ ràng). Ghi lại đây để agent hiểu logic mà không cần đọc code.

### 2.1 Công thức tổng

```
score = Σ (weight_i × d_i) / Σ weight_i
```

Với mỗi chiều đặc trưng `i`:
- `d_i ∈ [0, 1]` — độ tương đồng (0 = hoàn toàn khác, 1 = giống hệt)
- `weight_i` — trọng số, tổng = 1.0

**Kết quả cuối:** `compatibility_score ∈ [0, 1]`, nhân 100 → `compatibility_pct` (0–100, integer).

### 2.2 Các chiều đặc trưng và trọng số

| Chiều | Tên field DB (`lifestyle_profiles`) | Trọng số | Loại khoảng cách | Ghi chú |
|---|---|---|---|---|
| Giờ thức dậy | `wake_time` (text "HH:MM") | 0.15 | `circ(a, b, 6)` | Vòng tròn 24h, tolerance 6h |
| Giờ đi ngủ | `sleep_time` (text "HH:MM") | 0.15 | `circ(a, b, 6)` | Vòng tròn 24h |
| Mức độ gọn gàng | `cleanliness_level` (int 1–5) | 0.20 | linear `1 - |a-b|/4` | Chênh lệch tuyến tính |
| Hút thuốc | `smoking` (boolean) | 0.15 | exact match: 1 nếu bằng nhau, 0 nếu khác | Lọc cứng — khác = 0 điểm |
| Tần suất có bạn về | `guest_frequency` (int 1–5) | 0.10 | linear `1 - |a-b|/4` | |
| Thói quen nấu ăn | `cooking_habit` (enum) | 0.10 | exact match + partial (xem bên dưới) | |
| Mức ồn ào chấp nhận được | `noise_tolerance` (int 1–5) | 0.10 | linear `1 - |a-b|/4` | |
| Sở thích thú cưng | `pet_preference` (boolean) | 0.05 | exact match | |

> **Lưu ý `cooking_habit`:** `never ↔ rare = 0.7`, `rare ↔ sometimes = 0.7`, `sometimes ↔ always = 0.7`, còn lại bằng nhau = 1.0, khác 2 bậc = 0.3.

### 2.3 Filter cứng (loại trước khi tính điểm)

Nếu bất kỳ điều kiện nào sau đây vi phạm, ứng viên **bị loại hoàn toàn** (không được vào danh sách kết quả):

```
city             ≠ caller.city          → loại
budget_max       < caller.budget_min    → loại  (khoảng ngân sách không giao nhau)
budget_min       > caller.budget_max    → loại
gender_pref      ≠ 'any'
  AND gender_pref ≠ candidate.gender   → loại
```

### 2.4 Hàm `circ(a, b, tolerance)` — khoảng cách vòng tròn

```ts
// a, b: giờ dạng "HH:MM" → convert sang số giờ (float)
// tolerance: đơn vị giờ
// Trả về d ∈ [0, 1]
function circ(a: string, b: string, tolerance: number): number {
  const toH = (s: string) => {
    const [h, m] = s.split(':').map(Number);
    return h + m / 60;
  };
  const diff = Math.abs(toH(a) - toH(b));
  const circular = Math.min(diff, 24 - diff);   // vòng tròn 24h
  return Math.max(0, 1 - circular / tolerance);
}
```

**Test case bắt buộc pass (đừng sửa):**
- `circ('23:00', '01:00', 6)` → `0.667` (chênh 2h, không phải 22h)
- `circ('07:00', '07:00', 6)` → `1.000` (giống hệt)
- `circ('07:00', '13:00', 6)` → `0.000` (lệch 6h = tolerance → 0)

### 2.5 Sinh `matching_reasons` từ `breakdown`

Sau khi tính điểm từng chiều, `index.ts` phân loại:

```ts
// Chiều nào d_i >= 0.80 → đưa vào strengths (tối đa 3)
// Chiều nào d_i <= 0.30 → đưa vào considerations (tối đa 2)
// Sinh câu text từ template map (không gọi LLM)
```

**Template map (ví dụ):**

| Chiều | strength text | consideration text |
|---|---|---|
| `wake_time` | `"Cùng thói quen dậy sớm"` | `"Giờ thức dậy hơi lệch nhau"` |
| `sleep_time` | `"Cùng thói quen ngủ sớm"` | `"Giờ đi ngủ khá khác nhau"` |
| `cleanliness_level` | `"Cùng tiêu chuẩn gọn gàng"` | `"Mức độ gọn gàng có thể cần thỏa hiệp"` |
| `smoking` | `"Cùng quan điểm về hút thuốc"` | — *(nếu khác → đã bị filter cứng loại)* |
| `guest_frequency` | `"Cùng quan điểm về khách đến nhà"` | `"Tần suất dẫn bạn bè về nhà hơi khác nhau"` |
| `cooking_habit` | `"Cùng thói quen nấu ăn"` | `"Thói quen nấu ăn có đôi chút khác biệt"` |
| `noise_tolerance` | `"Cùng ngưỡng ồn ào chấp nhận được"` | `"Mức độ ồn ào chấp nhận được có thể xung đột"` |
| `pet_preference` | `"Cùng quan điểm về thú cưng"` | `"Quan điểm về thú cưng hơi khác"` |

---

## 3. I/O Chính — Edge Function `compute-matches`

### 3.1 Request

```
POST /functions/v1/compute-matches
Authorization: Bearer <user_jwt>   ← bắt buộc, JWT người dùng thường
Content-Type: application/json
```

```json
{
  "limit": 20
}
```

| Field | Kiểu | Bắt buộc | Mặc định | Ghi chú |
|---|---|---|---|---|
| `limit` | `integer` | Không | `20` | Tối đa `50`. Nếu vượt quá, clamp về 50. |

**Điều kiện tiên quyết (server kiểm tra):**

- JWT hợp lệ, `caller_id` tồn tại trong `profiles`
- `lifestyle_profiles` của caller đã điền đủ các trường bắt buộc (city, budget_min, budget_max, wake_time, sleep_time, cleanliness_level, smoking, gender, gender_pref)
- Nếu thiếu → trả `400` với `{ "error": "INCOMPLETE_PROFILE", "missing_fields": [...] }`

### 3.2 Response — **Shape mục tiêu (sau khi vá Bug B2)**

```json
{
  "ok": true,
  "count": 12,
  "suggestions": [
    {
      "candidate_id": "550e8400-e29b-41d4-a716-446655440000",
      "display_name": "Minh Đức",
      "avatar_url": null,
      "compatibility_score": 0.88,
      "compatibility_pct": 88,
      "strengths": [
        "Cùng thói quen ngủ sớm dậy sớm",
        "Ngân sách trùng khớp",
        "Cùng quan điểm về thú cưng"
      ],
      "conflicts": [
        "Tần suất dẫn bạn bè về nhà hơi khác nhau"
      ],
      "lifestyle": null,
      "trust": null,
      "is_seed_data": false,
      "breakdown": {
        "wake": 1.0,
        "sleep": 0.83,
        "cleanliness": 0.75,
        "smoking": 1.0,
        "guest_frequency": 0.25,
        "cooking_habit": 0.7,
        "noise_tolerance": 0.9,
        "pet_preference": 1.0
      }
    }
  ]
}
```

**Bảng ánh xạ field (hiện tại → mục tiêu):**

| Field hiện tại | Field mục tiêu | Ghi chú |
|---|---|---|
| `matching_reasons` (string[]) | `strengths` (string[]) | Đổi tên, giữ nguyên giá trị |
| `consideration` (string đơn) | `conflicts` (string[]) | Đổi từ string → array; dùng toàn bộ `reasons.considerations` từ cache row |
| *(không có)* | `compatibility_score` (float 0–1) | Thêm mới = `score` trước khi × 100 |
| `compatibility_pct` (int) | `compatibility_pct` (int) | Giữ nguyên |
| *(không có)* | `lifestyle` | Luôn trả `null` — mobile tự query nếu cần |
| *(không có)* | `trust` | Luôn trả `null` — mobile dùng RPC `get_user_trust()` riêng |

> **Quan trọng:** Format ghi vào bảng `match_suggestions` (DB cache) **không thay đổi** — chỉ thay đổi cách `index.ts` map từ bản ghi DB sang JSON response cho client.

### 3.3 Error Responses

| HTTP Code | `error` code | Khi nào |
|---|---|---|
| `400` | `INCOMPLETE_PROFILE` | Caller chưa điền đủ trường bắt buộc trong `lifestyle_profiles` |
| `400` | `INVALID_LIMIT` | `limit` không phải integer dương |
| `401` | `UNAUTHORIZED` | JWT thiếu hoặc không hợp lệ |
| `404` | `PROFILE_NOT_FOUND` | `caller_id` không có row trong `lifestyle_profiles` |
| `500` | `INTERNAL_ERROR` | Lỗi DB hoặc lỗi không xác định |

```json
{
  "ok": false,
  "error": "INCOMPLETE_PROFILE",
  "missing_fields": ["wake_time", "sleep_time"]
}
```

---

## 4. Schema DB — Bảng liên quan

### 4.1 `lifestyle_profiles` (input chính của module)

```sql
create table lifestyle_profiles (
  id            uuid primary key references profiles(id) on delete cascade,
  -- Địa lý & tài chính (filter cứng)
  city          text not null,
  budget_min    numeric not null,
  budget_max    numeric not null,
  -- Nhân khẩu học (filter cứng)
  gender        text not null,           -- 'male' | 'female' | 'other'
  gender_pref   text not null default 'any',  -- 'male' | 'female' | 'any'
  -- Thói quen (scoring)
  wake_time     text not null,           -- "HH:MM"
  sleep_time    text not null,           -- "HH:MM"
  cleanliness_level  int not null check (cleanliness_level between 1 and 5),
  smoking       boolean not null,
  guest_frequency    int not null check (guest_frequency between 1 and 5),
  cooking_habit text not null,           -- 'never' | 'rare' | 'sometimes' | 'always'
  noise_tolerance    int not null check (noise_tolerance between 1 and 5),
  pet_preference     boolean not null,
  -- Metadata
  is_seed_data  boolean not null default false,
  bio           text,
  updated_at    timestamptz not null default now()
);
```

> **RLS:** User chỉ đọc được row của chính mình qua client thường. `compute-matches` dùng `service_role` để đọc tất cả ứng viên.

### 4.2 `match_suggestions` (cache output)

```sql
create table match_suggestions (
  id              uuid primary key default gen_random_uuid(),
  requester_id    uuid not null references profiles(id) on delete cascade,
  candidate_id    uuid not null references profiles(id) on delete cascade,
  score           numeric not null,         -- 0..1
  compatibility_pct int not null,           -- 0..100
  reasons         jsonb not null,           -- { "strengths": [...], "considerations": [...] }
  breakdown       jsonb,                    -- { "wake": 1.0, "sleep": 0.83, ... }
  is_seed_data    boolean not null default false,
  trust_score     int,                      -- snapshot tại thời điểm tính
  created_at      timestamptz not null default now(),
  unique (requester_id, candidate_id)
);
```

**Cache strategy:**
- Khi gọi lại `compute-matches`, nếu đã có row `(requester_id, candidate_id)` trong 24h → **dùng lại** (không tính lại điểm)
- Nếu cache miss hoặc cũ hơn 24h → tính lại, upsert vào bảng
- Gợi ý: thêm cột `expires_at = created_at + interval '24 hours'`, index trên `(requester_id, expires_at)`

---

## 5. Zod Schema — `packages/shared-types/src/api-contracts.ts`

### 5.1 Schema cần cập nhật (Bug B3)

```ts
// TRƯỚC (không khớp thực tế)
export const MatchSuggestionItemSchema = z.object({
  candidate_id: z.string().uuid(),
  display_name: z.string(),
  avatar_url: z.string().nullable(),
  compatibility_score: z.number().min(0).max(1),  // ← đang thiếu field này trong response thật
  reasons: z.object({
    conflicts: z.array(z.string()),               // ← sai cấu trúc
  }),
});

// SAU (khớp response shape Mục 3.2)
export const MatchSuggestionItemSchema = z.object({
  candidate_id: z.string().uuid(),
  display_name: z.string(),
  avatar_url: z.string().nullable(),
  compatibility_score: z.number().min(0).max(1),
  compatibility_pct: z.number().int().min(0).max(100),
  strengths: z.array(z.string()),
  conflicts: z.array(z.string()),
  lifestyle: z.null(),                            // luôn null từ Edge Function
  trust: z.null(),                                // luôn null từ Edge Function
  is_seed_data: z.boolean(),
  breakdown: z.record(z.string(), z.number()).optional(),
});

export const ComputeMatchesResponseSchema = z.object({
  ok: z.literal(true),
  count: z.number().int(),
  suggestions: z.array(MatchSuggestionItemSchema),
});

export const ComputeMatchesErrorSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
  missing_fields: z.array(z.string()).optional(),
});

// Union type cho toàn bộ response
export const ComputeMatchesApiResponseSchema = z.discriminatedUnion('ok', [
  ComputeMatchesResponseSchema,
  ComputeMatchesErrorSchema,
]);

export type MatchSuggestionItem = z.infer<typeof MatchSuggestionItemSchema>;
export type ComputeMatchesResponse = z.infer<typeof ComputeMatchesResponseSchema>;
```

---

## 6. Checklist sửa Bug B2 & B3

> Đây là các thay đổi cần thiết **ngay bây giờ**. Không cần làm gì thêm ngoài danh sách này.

### `supabase/functions/compute-matches/index.ts`

- [ ] Khi build object `suggestion` cho response, map:
  - `matching_reasons` → `strengths`
  - `consideration` (string) → `conflicts` (mảng: lấy từ `reasons.considerations` của cache row, hoặc wrap string vào array `[consideration]` nếu chưa mảng)
  - Thêm `compatibility_score = score` (float 0–1, **trước khi** nhân 100)
  - Giữ `compatibility_pct` (int)
  - Thêm `lifestyle: null`
  - Thêm `trust: null`
- [ ] Giữ nguyên format `upsert` vào bảng `match_suggestions` — **không thay đổi schema DB**
- [ ] Giữ nguyên `scoring.ts` — không sửa

### `packages/shared-types/src/api-contracts.ts`

- [ ] Thay `MatchSuggestionItemSchema` và `ComputeMatchesResponseSchema` theo Mục 5.1

### Không cần làm

- Không sửa `scoring.ts`
- Không sửa bất kỳ file nào trong `apps/mobile/`
- Không thêm JOIN thêm bảng để lấy `lifestyle` hay `trust` — trả `null` là đúng thiết kế

---

## 7. Kiểm tra / Test

### 7.1 Unit tests bắt buộc pass (không sửa)

File: `supabase/functions/compute-matches/scoring.test.ts`

| Test case | Kết quả kỳ vọng |
|---|---|
| Hai hồ sơ giống hệt nhau | `score = 1.00` |
| `circ('23:00', '01:00', 6)` | `0.667` (không phải 0.083) |
| Hút thuốc khác nhau | `score = 0` (filter cứng) |
| Khác thành phố | Bị loại khỏi danh sách (không có trong kết quả) |
| Ngân sách không giao nhau | Bị loại khỏi danh sách |
| `score` đối xứng (A↔B = B↔A) | `scoreAB === scoreBA` |

### 7.2 Integration test thủ công (sau khi vá)

```bash
# Gọi Edge Function trực tiếp (không qua app)
curl -X POST 'https://<project_ref>.supabase.co/functions/v1/compute-matches' \
  -H 'Authorization: Bearer <user_jwt>' \
  -H 'Content-Type: application/json' \
  -d '{"limit": 5}'

# Kiểm tra response có đủ các field sau trong mỗi suggestion:
#   - strengths (array, không phải undefined)
#   - conflicts (array, không phải undefined)
#   - compatibility_score (float 0–1)
#   - compatibility_pct (int 0–100)
#   - lifestyle (null)
#   - trust (null)
```

### 7.3 Smoke test với mobile (sau khi vá)

1. Mở màn **Discover** trên app (nhánh `dev`)
2. Danh sách gợi ý xuất hiện với % match thật (không phải số ngẫu nhiên)
3. Không có `TypeError: Cannot read properties of undefined (reading 'map')` trong logs
4. Trust Score hiển thị `85` (hard-code — Bug B4, thuộc App, không phải Matching Engine)

---

## 8. Các việc P2 (không chặn MVP — ghi lại để làm sau)

| # | Việc | Độ ưu tiên | Ghi chú |
|---|---|---|---|
| P2-1 | Phân trang cursor-based (`after_cursor`) | P2 | Khi số lượng ứng viên lớn |
| P2-2 | Cache invalidation khi `lifestyle_profiles` update | P2 | Hiện chỉ có TTL 24h |
| P2-3 | Lọc theo `is_seed_data = false` tuỳ chọn | P2 | Để production không trộn data thật + seed |
| P2-4 | Endpoint `GET /compute-matches/history` — trả lại cache đã tính | P2 | Tránh recalculate khi user navigate back |
| P2-5 | Thêm `exclude_ids` vào request (loại trừ user đã swipe rồi) | P2 | Cần thêm bảng `swipe_history` |

---

## 9. Lịch sử thay đổi

| Ngày | Phiên bản | Nội dung |
|---|---|---|
| 2026-09-28 | `v1.0` | Tạo mới — trích xuất và mở rộng từ `AI_MODULE_IO_SPEC.md` Mục 2 |

---

*Nếu phát hiện lỗi hoặc lệch so với code thực tế, ghi vào Bug Log của `AI_MODULE_IO_SPEC.md` Mục 1, không sửa trực tiếp file này mà không cập nhật đồng thời.*
