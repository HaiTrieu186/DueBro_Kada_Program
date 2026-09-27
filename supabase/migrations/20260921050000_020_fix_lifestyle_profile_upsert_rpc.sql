-- ===== 020_fix_lifestyle_profile_upsert_rpc.sql (Fix-forward Migration) =====
-- Architecture Section 4.4, Section 6.1 & Section 9.1
-- Khắc phục lỗi 42501 (permission denied for table lifestyle_profiles):
-- 1. Bổ sung RPC save_lifestyle_profile (SECURITY DEFINER) - chuẩn kiến trúc Due Bro (Client không ghi trực tiếp bảng nghiệp vụ).
-- 2. Bổ sung column-level grants đầy đủ cho bảng lifestyle_profiles (bao gồm updated_at và user_id) để tương thích ngược.

create or replace function save_lifestyle_profile(
  p_intent text default 'seeking_roommate',
  p_city text default 'TP. Hồ Chí Minh',
  p_district text default null,
  p_gender text default null,
  p_gender_pref text default 'any',
  p_occupation_type text default 'student',
  p_wake_up_time time default '07:00',
  p_sleep_time time default '23:00',
  p_budget_min int default 1500000,
  p_budget_max int default 3500000,
  p_tidiness_level int default 3,
  p_noise_tolerance int default 3,
  p_smokes boolean default false,
  p_has_pet boolean default false,
  p_guest_frequency text default 'sometimes',
  p_guest_curfew time default null,
  p_bio text default null,
  p_display_name text default null
)
returns lifestyle_profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_me uuid := auth.uid();
  v_res lifestyle_profiles;
begin
  if v_me is null then
    raise exception 'Chưa đăng nhập';
  end if;

  -- Validate constraints nghiệp vụ
  if p_intent not in ('seeking_roommate', 'has_room') then
    raise exception 'intent không hợp lệ';
  end if;
  if p_city is null or length(trim(p_city)) = 0 then
    raise exception 'Thành phố không được để trống';
  end if;
  if p_occupation_type not in ('student', 'worker', 'freelancer', 'other') then
    raise exception 'Nghề nghiệp không hợp lệ';
  end if;
  if p_budget_min < 0 or p_budget_max < p_budget_min then
    raise exception 'Ngân sách không hợp lệ';
  end if;
  if p_tidiness_level not between 1 and 5 then
    raise exception 'Mức độ gọn gàng phải từ 1 đến 5';
  end if;
  if p_noise_tolerance not between 1 and 5 then
    raise exception 'Độ chịu ồn phải từ 1 đến 5';
  end if;
  if p_guest_frequency not in ('never', 'rarely', 'sometimes', 'often') then
    raise exception 'Tần suất dắt bạn về không hợp lệ';
  end if;
  if p_gender is not null and p_gender not in ('male', 'female', 'other') then
    raise exception 'Giới tính không hợp lệ';
  end if;
  if p_gender_pref not in ('any', 'same') then
    raise exception 'Ưu tiên giới tính không hợp lệ';
  end if;
  if p_bio is not null and char_length(p_bio) > 300 then
    raise exception 'Bio không được quá 300 ký tự';
  end if;

  -- 1. Cập nhật display_name trong profiles nếu được truyền
  if p_display_name is not null and length(trim(p_display_name)) > 0 then
    update profiles
    set display_name = trim(p_display_name)
    where id = v_me;
  end if;

  -- 2. Upsert lifestyle_profiles (bảo vệ is_seed_data và seed_trust_score khỏi client)
  insert into lifestyle_profiles (
    user_id, intent, city, district, gender, gender_pref, occupation_type,
    wake_up_time, sleep_time, budget_min, budget_max, tidiness_level,
    noise_tolerance, smokes, has_pet, guest_frequency, guest_curfew, bio,
    updated_at
  ) values (
    v_me,
    coalesce(p_intent, 'seeking_roommate'),
    trim(p_city),
    nullif(trim(p_district), ''),
    p_gender,
    coalesce(p_gender_pref, 'any'),
    p_occupation_type,
    p_wake_up_time,
    p_sleep_time,
    p_budget_min,
    p_budget_max,
    p_tidiness_level,
    p_noise_tolerance,
    coalesce(p_smokes, false),
    coalesce(p_has_pet, false),
    coalesce(p_guest_frequency, 'sometimes'),
    p_guest_curfew,
    nullif(trim(p_bio), ''),
    now()
  )
  on conflict (user_id) do update set
    intent = excluded.intent,
    city = excluded.city,
    district = excluded.district,
    gender = excluded.gender,
    gender_pref = excluded.gender_pref,
    occupation_type = excluded.occupation_type,
    wake_up_time = excluded.wake_up_time,
    sleep_time = excluded.sleep_time,
    budget_min = excluded.budget_min,
    budget_max = excluded.budget_max,
    tidiness_level = excluded.tidiness_level,
    noise_tolerance = excluded.noise_tolerance,
    smokes = excluded.smokes,
    has_pet = excluded.has_pet,
    guest_frequency = excluded.guest_frequency,
    guest_curfew = excluded.guest_curfew,
    bio = excluded.bio,
    updated_at = now()
  returning * into v_res;

  return v_res;
end;
$$;

revoke execute on function save_lifestyle_profile from public, anon;
grant execute on function save_lifestyle_profile to authenticated;

-- Củng cố phân quyền trực tiếp (defense-in-depth cho PostgREST upsert)
grant insert (user_id, intent, city, district, gender, gender_pref, occupation_type, wake_up_time, sleep_time,
              budget_min, budget_max, tidiness_level, noise_tolerance, smokes, has_pet, guest_frequency,
              guest_curfew, bio, updated_at)
  on lifestyle_profiles to authenticated;

grant update (user_id, intent, city, district, gender, gender_pref, occupation_type, wake_up_time, sleep_time,
              budget_min, budget_max, tidiness_level, noise_tolerance, smokes, has_pet, guest_frequency,
              guest_curfew, bio, updated_at)
  on lifestyle_profiles to authenticated;

-- 3. Bổ sung task_instances vào Realtime publication (ARCH Mục 4.7 & R8)
do $$
begin
  alter publication supabase_realtime add table task_instances;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- 4. Khởi tạo Storage buckets và policies (ARCH Mục 4.7 & Mục 12)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('task-photos', 'task-photos', false, 1048576, null),
  ('avatars', 'avatars', true, 1048576, null)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = null;

do $$
begin
  -- task-photos policies
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'task_photos_read') then
    create policy "task_photos_read" on storage.objects for select to authenticated
      using (
        bucket_id = 'task-photos'
        and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and is_room_member(((storage.foldername(name))[1])::uuid)
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'task_photos_insert') then
    create policy "task_photos_insert" on storage.objects for insert to authenticated
      with check (
        bucket_id = 'task-photos'
        and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and is_room_member(((storage.foldername(name))[1])::uuid)
      );
  end if;

  -- avatars policies
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars_read') then
    create policy "avatars_read" on storage.objects for select to public
      using (bucket_id = 'avatars');
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars_write_own') then
    create policy "avatars_write_own" on storage.objects for insert to authenticated
      with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
exception
  when undefined_table then null;
  when insufficient_privilege then null;
end $$;
