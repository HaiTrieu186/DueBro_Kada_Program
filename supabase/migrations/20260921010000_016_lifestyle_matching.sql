-- ===== 016_lifestyle_matching.sql (AI sở hữu) =====
-- Architecture Section 4.4: Matching Tables, Hard Filters, Swipes, Connections & Room Proposal

create table lifestyle_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  intent text not null default 'seeking_roommate' check (intent in ('seeking_roommate', 'has_room')),
  city text not null,
  district text,
  gender text check (gender in ('male', 'female', 'other')),
  gender_pref text not null default 'any' check (gender_pref in ('any', 'same')),
  occupation_type text not null check (occupation_type in ('student', 'worker', 'freelancer', 'other')),
  wake_up_time time not null,
  sleep_time time not null,
  budget_min int not null check (budget_min >= 0),              -- VND / tháng
  budget_max int not null check (budget_max >= budget_min),
  tidiness_level int not null check (tidiness_level between 1 and 5),
  noise_tolerance int not null check (noise_tolerance between 1 and 5),
  smokes boolean not null default false,
  has_pet boolean not null default false,
  guest_frequency text not null default 'sometimes' check (guest_frequency in ('never', 'rarely', 'sometimes', 'often')),
  guest_curfew time,
  bio text check (char_length(bio) <= 300),
  is_seed_data boolean not null default false,                  -- chỉ service_role được set
  seed_trust_score int check (seed_trust_score between 0 and 100), -- chỉ dùng cho seed
  updated_at timestamptz not null default now()
);

alter table lifestyle_profiles enable row level security;
create policy "lp_select_authenticated" on lifestyle_profiles for select to authenticated using (true);
create policy "lp_insert_own" on lifestyle_profiles for insert to authenticated with check (user_id = auth.uid());
create policy "lp_update_own" on lifestyle_profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Chặn client tự set cờ seed: chỉ cấp quyền ghi trên các cột nghiệp vụ
revoke insert, update, delete on lifestyle_profiles from anon, authenticated;
grant insert (user_id, intent, city, district, gender, gender_pref, occupation_type, wake_up_time, sleep_time,
              budget_min, budget_max, tidiness_level, noise_tolerance, smokes, has_pet, guest_frequency,
              guest_curfew, bio)
  on lifestyle_profiles to authenticated;
grant update (intent, city, district, gender, gender_pref, occupation_type, wake_up_time, sleep_time,
              budget_min, budget_max, tidiness_level, noise_tolerance, smokes, has_pet, guest_frequency,
              guest_curfew, bio, updated_at)
  on lifestyle_profiles to authenticated;

create table match_suggestions (
  user_id uuid not null references profiles(id) on delete cascade,
  candidate_id uuid not null references profiles(id) on delete cascade,
  compatibility_score numeric not null check (compatibility_score between 0 and 1),
  breakdown jsonb not null,           -- {"sleep":0.83,"tidiness":1,...}
  reasons jsonb not null,             -- {"strengths":[...],"conflicts":[...]}
  model_version text not null,        -- 'match_v1'
  computed_at timestamptz not null default now(),
  primary key (user_id, candidate_id)
);

alter table match_suggestions enable row level security;
create policy "ms_select_own" on match_suggestions for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on match_suggestions from anon, authenticated;   -- chỉ Edge Function (service_role) ghi

create table match_actions (
  user_id uuid not null references profiles(id) on delete cascade,
  candidate_id uuid not null references profiles(id) on delete cascade,
  action text not null check (action in ('liked', 'passed')),
  created_at timestamptz not null default now(),
  primary key (user_id, candidate_id),
  check (user_id <> candidate_id)
);

alter table match_actions enable row level security;
create policy "ma_select_own" on match_actions for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on match_actions from anon, authenticated;       -- ghi qua RPC swipe()

create table match_connections (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references profiles(id),
  user_b_id uuid not null references profiles(id),
  status text not null default 'chatting' check (status in ('chatting', 'room_proposed', 'housed', 'closed')),
  proposed_by uuid references profiles(id),
  proposed_room_name text,
  room_id uuid references rooms(id),
  created_at timestamptz not null default now(),
  check (user_a_id < user_b_id),                    -- luôn sắp xếp để tránh trùng cặp (a,b)/(b,a)
  unique (user_a_id, user_b_id)
);

create or replace function is_connection_member(target_connection_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from match_connections
    where id = target_connection_id and (user_a_id = auth.uid() or user_b_id = auth.uid())
  );
$$;

alter table match_connections enable row level security;
create policy "mc_select_own" on match_connections for select to authenticated
  using (user_a_id = auth.uid() or user_b_id = auth.uid());
revoke insert, update, delete on match_connections from anon, authenticated;

-- swipe: ghi hành động; nếu 2 bên cùng 'liked' → tạo connection. (DEMO: like hồ sơ seed = match luôn)
create or replace function swipe(p_candidate_id uuid, p_action text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_me uuid := auth.uid();
  v_a uuid; v_b uuid; v_conn uuid; v_mutual boolean;
begin
  if v_me is null then raise exception 'Chưa đăng nhập'; end if;
  if p_action not in ('liked', 'passed') then raise exception 'action không hợp lệ'; end if;
  if p_candidate_id = v_me then raise exception 'Không thể tự chọn mình'; end if;
  if not exists (select 1 from lifestyle_profiles where user_id = v_me) then
    raise exception 'Hãy hoàn thành hồ sơ lối sống trước';
  end if;
  if not exists (select 1 from lifestyle_profiles where user_id = p_candidate_id) then
    raise exception 'Ứng viên không tồn tại';
  end if;

  insert into match_actions (user_id, candidate_id, action) values (v_me, p_candidate_id, p_action)
  on conflict (user_id, candidate_id) do update set action = excluded.action, created_at = now();

  if p_action = 'passed' then return jsonb_build_object('matched', false); end if;

  v_mutual := exists (select 1 from match_actions where user_id = p_candidate_id and candidate_id = v_me and action = 'liked')
              or exists (select 1 from lifestyle_profiles where user_id = p_candidate_id and is_seed_data);
  if not v_mutual then return jsonb_build_object('matched', false); end if;

  v_a := least(v_me, p_candidate_id); v_b := greatest(v_me, p_candidate_id);
  insert into match_connections (user_a_id, user_b_id) values (v_a, v_b)
  on conflict (user_a_id, user_b_id) do nothing;
  select id into v_conn from match_connections where user_a_id = v_a and user_b_id = v_b;
  return jsonb_build_object('matched', true, 'connection_id', v_conn);
end;
$$;

-- Đề xuất tạo phòng (bước 1) → đối phương chấp nhận (bước 2) → phòng + 2 thành viên được tạo
create or replace function propose_room(p_connection_id uuid, p_room_name text)
returns match_connections language plpgsql security definer set search_path = public, pg_temp as $$
declare v_conn match_connections;
begin
  if not is_connection_member(p_connection_id) then raise exception 'Không thuộc kết nối này'; end if;
  if length(trim(coalesce(p_room_name, ''))) < 2 then raise exception 'Tên phòng quá ngắn'; end if;
  update match_connections
  set status = 'room_proposed', proposed_by = auth.uid(), proposed_room_name = trim(p_room_name)
  where id = p_connection_id and status in ('chatting', 'room_proposed')
  returning * into v_conn;
  if v_conn.id is null then raise exception 'Kết nối không ở trạng thái có thể đề xuất phòng'; end if;
  return v_conn;
end;
$$;

create or replace function accept_room(p_connection_id uuid)
returns rooms language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_conn match_connections; v_room rooms; v_code text; v_other uuid;
begin
  if not is_connection_member(p_connection_id) then raise exception 'Không thuộc kết nối này'; end if;
  select * into v_conn from match_connections where id = p_connection_id for update;
  if v_conn.status <> 'room_proposed' then raise exception 'Chưa có đề xuất phòng để chấp nhận'; end if;
  if v_conn.proposed_by = auth.uid() then raise exception 'Người đề xuất không thể tự chấp nhận'; end if;

  loop
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    begin
      insert into rooms (name, invite_code, created_by)
      values (v_conn.proposed_room_name, v_code, v_conn.proposed_by) returning * into v_room;
      exit;
    exception when unique_violation then null;
    end;
  end loop;

  v_other := auth.uid();
  insert into room_members (room_id, member_id, role) values (v_room.id, v_conn.proposed_by, 'host');
  insert into room_members (room_id, member_id, role) values (v_room.id, v_other, 'member');
  insert into weekly_quota_targets (room_id, member_id, week_start, target_points)
  select v_room.id, m, vn_week_start(), 60 from unnest(array[v_conn.proposed_by, v_other]) m;

  update match_connections set status = 'housed', room_id = v_room.id where id = p_connection_id;
  return v_room;
end;
$$;

grant execute on function is_connection_member(uuid) to authenticated;
grant execute on function swipe(uuid, text) to authenticated;
grant execute on function propose_room(uuid, text) to authenticated;
grant execute on function accept_room(uuid) to authenticated;
