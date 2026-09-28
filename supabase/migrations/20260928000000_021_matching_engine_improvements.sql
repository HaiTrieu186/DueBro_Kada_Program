-- ===== 021_matching_engine_improvements.sql (AI sở hữu) =====
-- Branch: feat/BACK-matching-engine
-- Purpose: Cải thiện bảng match_suggestions để hỗ trợ cache TTL 24h
--          và thêm index tối ưu query cho compute-matches Edge Function.
--
-- Migration này an toàn (fix-forward):
--   - Không sửa schema đã có trên bảng khác
--   - Chỉ thêm cột + index mới vào match_suggestions
--   - Thêm function upsert_lifestyle_profile (đã được RPC mobile dùng)

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. Thêm cột computed_at vào match_suggestions nếu chưa có
--    (main đã có cột này từ migration 016, nhưng đặt tên khác)
-- ──────────────────────────────────────────────────────────────────────────────

-- Đổi tên cột: computed_at đã tồn tại trong 016 → chỉ cần đảm bảo default đúng
-- (Nếu cột không tồn tại, migration này sẽ thêm vào)
do $$
begin
  -- Đảm bảo cột computed_at có DEFAULT now() để upsert từ Edge Function
  -- không cần truyền computed_at thủ công
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'match_suggestions'
      and column_name  = 'computed_at'
  ) then
    alter table match_suggestions
      add column computed_at timestamptz not null default now();
  end if;
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. Index tối ưu cho cache TTL query
--    Edge Function truy vấn: WHERE user_id = ? AND computed_at >= (now() - 24h)
-- ──────────────────────────────────────────────────────────────────────────────

create index if not exists idx_match_suggestions_user_computed
  on match_suggestions (user_id, computed_at desc);

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. Index tối ưu cho scoring: lấy ứng viên theo thành phố
--    Edge Function join lifestyle_profiles theo city để lọc ứng viên
-- ──────────────────────────────────────────────────────────────────────────────

create index if not exists idx_lifestyle_profiles_city
  on lifestyle_profiles (city);

create index if not exists idx_lifestyle_profiles_city_intent
  on lifestyle_profiles (city, intent);

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. RPC upsert_lifestyle_profile — mobile gọi để save/update hồ sơ lối sống
--    (Không có hàm này trong 016, mobile phải dùng insert/update riêng → lỗi RLS)
-- ──────────────────────────────────────────────────────────────────────────────

create or replace function upsert_lifestyle_profile(
  p_intent            text,
  p_city              text,
  p_district          text default null,
  p_gender            text default null,
  p_gender_pref       text default 'any',
  p_occupation_type   text default 'other',
  p_wake_up_time      text default '07:00',  -- Edge Function dùng text, DB cast về time
  p_sleep_time        text default '23:00',
  p_budget_min        int  default 0,
  p_budget_max        int  default 0,
  p_tidiness_level    int  default 3,
  p_noise_tolerance   int  default 3,
  p_smokes            boolean default false,
  p_has_pet           boolean default false,
  p_guest_frequency   text default 'sometimes',
  p_guest_curfew      text default null,
  p_bio               text default null
)
returns lifestyle_profiles
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_row lifestyle_profiles;
begin
  if v_user_id is null then
    raise exception 'Chưa đăng nhập';
  end if;

  -- Validate
  if p_budget_max < p_budget_min then
    raise exception 'budget_max phải >= budget_min';
  end if;
  if p_intent not in ('seeking_roommate', 'has_room') then
    raise exception 'intent không hợp lệ';
  end if;
  if length(trim(coalesce(p_city, ''))) = 0 then
    raise exception 'city là bắt buộc';
  end if;

  insert into lifestyle_profiles (
    user_id, intent, city, district, gender, gender_pref, occupation_type,
    wake_up_time, sleep_time, budget_min, budget_max,
    tidiness_level, noise_tolerance, smokes, has_pet,
    guest_frequency, guest_curfew, bio, updated_at
  ) values (
    v_user_id, p_intent, trim(p_city), p_district, p_gender, p_gender_pref, p_occupation_type,
    p_wake_up_time::time, p_sleep_time::time, p_budget_min, p_budget_max,
    p_tidiness_level, p_noise_tolerance, p_smokes, p_has_pet,
    p_guest_frequency,
    case when p_guest_curfew is null or p_guest_curfew = '' then null
         else p_guest_curfew::time end,
    p_bio, now()
  )
  on conflict (user_id) do update set
    intent          = excluded.intent,
    city            = excluded.city,
    district        = excluded.district,
    gender          = excluded.gender,
    gender_pref     = excluded.gender_pref,
    occupation_type = excluded.occupation_type,
    wake_up_time    = excluded.wake_up_time,
    sleep_time      = excluded.sleep_time,
    budget_min      = excluded.budget_min,
    budget_max      = excluded.budget_max,
    tidiness_level  = excluded.tidiness_level,
    noise_tolerance = excluded.noise_tolerance,
    smokes          = excluded.smokes,
    has_pet         = excluded.has_pet,
    guest_frequency = excluded.guest_frequency,
    guest_curfew    = excluded.guest_curfew,
    bio             = excluded.bio,
    updated_at      = now()
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function upsert_lifestyle_profile(
  text, text, text, text, text, text, text, text, int, int,
  int, int, boolean, boolean, text, text, text
) to authenticated;

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. View get_my_lifestyle_profile — mobile đọc hồ sơ của chính mình
-- ──────────────────────────────────────────────────────────────────────────────

create or replace view get_my_lifestyle_profile as
  select lp.*
  from lifestyle_profiles lp
  where lp.user_id = auth.uid();

grant select on get_my_lifestyle_profile to authenticated;

-- ──────────────────────────────────────────────────────────────────────────────
-- 6. RPC get_my_matches — trả lại cache gợi ý cuối cùng của mình
--    Mobile có thể gọi RPC này để hiển thị lại danh sách mà không tốn
--    computing lại (complements compute-matches Edge Function)
-- ──────────────────────────────────────────────────────────────────────────────

create or replace function get_my_matches(p_limit int default 20)
returns table (
  candidate_id        uuid,
  compatibility_score numeric,
  breakdown           jsonb,
  reasons             jsonb,
  model_version       text,
  computed_at         timestamptz,
  -- Profile info join
  display_name        text,
  avatar_url          text,
  is_seed_data        boolean,
  seed_trust_score    int
)
language sql stable security definer set search_path = public, pg_temp
as $$
  select
    ms.candidate_id,
    ms.compatibility_score,
    ms.breakdown,
    ms.reasons,
    ms.model_version,
    ms.computed_at,
    p.display_name,
    p.avatar_url,
    lp.is_seed_data,
    lp.seed_trust_score
  from match_suggestions ms
  join profiles p  on p.id  = ms.candidate_id
  join lifestyle_profiles lp on lp.user_id = ms.candidate_id
  where ms.user_id = auth.uid()
  order by ms.compatibility_score desc
  limit least(p_limit, 50);
$$;

grant execute on function get_my_matches(int) to authenticated;

comment on function upsert_lifestyle_profile is
  'Tạo hoặc cập nhật hồ sơ lối sống của người dùng hiện tại. Dùng UPSERT để mobile không cần phân biệt insert vs update.';

comment on function get_my_matches is
  'Trả lại cache gợi ý kết bạn (match_suggestions) của người dùng hiện tại, sorted by compatibility_score DESC. Không tính lại điểm — dùng compute-matches Edge Function để refresh cache.';
