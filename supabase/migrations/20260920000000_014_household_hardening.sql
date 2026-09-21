-- Migration 014: Household hardening (vá lỗ hổng bảo mật + lỗi nghiệp vụ phát hiện khi review 001-013)
-- Tất cả lỗi dưới đây đã được TÁI HIỆN và XÁC NHẬN trên Postgres 16 với migration 001-012 (xem Architecture v3, Mục 4.2).
-- Nguyên tắc: KHÔNG sửa migration cũ đã chạy — fix-forward bằng file mới này.
-- Chạy trong 1 transaction (supabase migration mặc định) nên KHÔNG dùng giá trị enum mới trong cùng file.

-- ============================================================
-- A. KHÓA GHI TRỰC TIẾP — mọi thay đổi trạng thái phải đi qua RPC
-- ============================================================
-- Lỗi cũ: policy UPDATE của task_instances/room_members/swap_requests cho member sửa MỌI cột
-- (tự nâng role='host', tự sửa karma_score, sửa effort_points, ép status='pending_approval'...).
drop policy if exists "room_members_can_claim_or_submit" on task_instances;
revoke insert, update, delete on task_instances from anon, authenticated;

drop policy if exists "room_members_can_update_own_status" on room_members;
revoke insert, update, delete on room_members from anon, authenticated;

drop policy if exists "room_members_can_insert_swap_requests" on swap_requests;
drop policy if exists "room_members_can_accept_swap_requests" on swap_requests;
revoke insert, update, delete on swap_requests from anon, authenticated;

-- nudge/dispute chỉ được tạo qua RPC (RPC mới có kiểm tra nghiệp vụ, chống spam)
drop policy if exists "insert_own_nudge" on nudge_requests;
drop policy if exists "insert_own_dispute" on disputes;
revoke insert, update, delete on nudge_requests from anon, authenticated;
revoke insert, update, delete on disputes from anon, authenticated;

-- ============================================================
-- B. anon KHÔNG được đụng vào gì cả (mọi tính năng đều yêu cầu đăng nhập)
-- ============================================================
-- Lỗi cũ: function mặc định EXECUTE cho PUBLIC => anon gọi được claim_task/... dù chỉ "grant to authenticated".
revoke all on all tables in schema public from anon;
revoke execute on all functions in schema public from public, anon;
alter default privileges in schema public revoke execute on functions from public, anon;
alter default privileges in schema public revoke all on tables from anon;

-- ============================================================
-- C. search_path + STABLE cho SECURITY DEFINER (chống hijack)
-- ============================================================
alter function is_room_member(uuid) set search_path = public, pg_temp;
alter function is_room_member(uuid) stable;
alter function propose_chore_template(uuid, text, text, int, int, text, boolean) set search_path = public, pg_temp;
alter function approve_chore_template(uuid) set search_path = public, pg_temp;
alter function process_silent_approvals() set search_path = public, pg_temp;
alter function reset_expired_away_status() set search_path = public, pg_temp;
alter function refresh_member_features() set search_path = public, pg_temp;

-- ============================================================
-- D. Enum mới (dùng ở migration 015+, KHÔNG dùng trong file này)
-- ============================================================
alter type point_reason add value if not exists 'karma_redemption';

-- disputes: reason_code (preset, công khai được) tách khỏi reason (free text, chỉ admin thấy)
alter table disputes add column if not exists reason_code text
  check (reason_code in ('not_clean','missing_photo','wrong_task','other'));

-- ============================================================
-- E. Helper: tuần bắt đầu theo giờ Việt Nam (DB chạy UTC -> lệch 7h nếu dùng date_trunc('week', now()))
-- ============================================================
create or replace function vn_week_start(p_ts timestamptz default now())
returns date language sql immutable
set search_path = public, pg_temp as $$
  select date_trunc('week', p_ts at time zone 'Asia/Ho_Chi_Minh')::date;
$$;

-- ============================================================
-- F. Profile tự tạo khi đăng ký (bản cũ KHÔNG có trigger này -> user mới không có row profiles)
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer
set search_path = public, pg_temp as $$
begin
  insert into profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''),
             nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
             'Bro')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function handle_new_user();

-- ============================================================
-- G. create_room (bản cũ THIẾU hoàn toàn: có join_room nhưng không có cách tạo phòng)
-- ============================================================
create or replace function create_room(p_name text)
returns rooms language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  v_room rooms;
  v_code text;
begin
  if auth.uid() is null then raise exception 'Chưa đăng nhập'; end if;
  if length(trim(coalesce(p_name, ''))) < 2 then raise exception 'Tên phòng quá ngắn'; end if;

  loop
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    begin
      insert into rooms (name, invite_code, created_by)
      values (trim(p_name), v_code, auth.uid())
      returning * into v_room;
      exit;
    exception when unique_violation then
      -- trùng invite_code -> thử mã khác
    end;
  end loop;

  insert into room_members (room_id, member_id, role) values (v_room.id, auth.uid(), 'host');
  insert into weekly_quota_targets (room_id, member_id, week_start, target_points)
  values (v_room.id, auth.uid(), vn_week_start(), 60);
  return v_room;
end;
$$;

-- ============================================================
-- H. join_room: sửa lỗi "rời phòng rồi KHÔNG vào lại được" (PK trùng) + race khi phòng gần đầy + tuần theo giờ VN
-- ============================================================
create or replace function join_room(p_invite_code text)
returns room_members language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  v_room rooms;
  v_current int;
  v_row room_members;
begin
  if auth.uid() is null then raise exception 'Chưa đăng nhập'; end if;

  select * into v_room from rooms where invite_code = upper(trim(p_invite_code)) for update;  -- khóa phòng, chống 2 người vào cùng lúc
  if v_room.id is null then raise exception 'Mã mời không hợp lệ'; end if;

  if exists (select 1 from room_members where room_id = v_room.id and member_id = auth.uid() and left_at is null) then
    raise exception 'Bạn đã ở trong phòng này rồi';
  end if;

  select count(*) into v_current from room_members where room_id = v_room.id and left_at is null;
  if v_current >= v_room.max_members then
    raise exception 'Phòng đã đầy (tối đa % thành viên)', v_room.max_members;
  end if;

  insert into room_members (room_id, member_id, role, is_new_member_until)
  values (v_room.id, auth.uid(), 'member', now() + interval '7 days')
  on conflict (room_id, member_id) do update
    set left_at = null, role = 'member', joined_at = now(),
        is_new_member_until = now() + interval '7 days',
        away_status = 'active', away_from = null, away_to = null
  returning * into v_row;

  insert into weekly_quota_targets (room_id, member_id, week_start, target_points)
  values (v_room.id, auth.uid(), vn_week_start(), 30)   -- Tân binh: 50% của 60
  on conflict (room_id, member_id, week_start) do nothing;

  return v_row;
end;
$$;

-- ============================================================
-- I. claim_task: thêm kiểm tra đăng nhập + thành viên phòng + Away (bản cũ: ai cũng claim được task phòng khác)
-- ============================================================
create or replace function claim_task(p_task_id uuid)
returns task_instances language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  v_room uuid;
  v_task task_instances;
begin
  if auth.uid() is null then raise exception 'Chưa đăng nhập'; end if;

  select room_id into v_room from task_instances where id = p_task_id;
  if v_room is null then raise exception 'Task không tồn tại'; end if;
  if not is_room_member(v_room) then raise exception 'Bạn không phải thành viên phòng này'; end if;

  if exists (select 1 from room_members
             where room_id = v_room and member_id = auth.uid() and left_at is null and away_status = 'away') then
    raise exception 'Bạn đang ở chế độ Away, không thể nhận việc';
  end if;

  update task_instances
  set status = 'claimed', claimed_by = auth.uid(), claimed_at = now(),
      assignment_method = 'volunteer', bonus_multiplier = 1.1
  where id = p_task_id and status = 'open'
  returning * into v_task;

  if v_task.id is null then
    raise exception 'Task đã được người khác nhận hoặc không còn ở trạng thái mở';
  end if;

  insert into task_events (task_id, event_type, actor_id) values (p_task_id, 'claimed', auth.uid());
  return v_task;
end;
$$;

-- ============================================================
-- J. submit_task: kiểm tra đường dẫn ảnh thuộc đúng phòng; resubmit sau dispute thì đóng dispute cũ
-- ============================================================
create or replace function submit_task(p_task_id uuid, p_photo_path text default null)
returns task_instances language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  v_task task_instances;
begin
  if auth.uid() is null then raise exception 'Chưa đăng nhập'; end if;

  select * into v_task from task_instances where id = p_task_id for update;
  if v_task.id is null then raise exception 'Task không tồn tại'; end if;
  if v_task.claimed_by is distinct from auth.uid() then
    raise exception 'Chỉ người được gán/nhận task mới được submit';
  end if;
  if v_task.status not in ('claimed', 'assigned', 'disputed') then
    raise exception 'Task không ở trạng thái có thể submit';
  end if;
  if v_task.requires_photo and p_photo_path is null then
    raise exception 'Task này bắt buộc phải có ảnh xác thực';
  end if;
  if p_photo_path is not null and p_photo_path not like (v_task.room_id::text || '/%') then
    raise exception 'Đường dẫn ảnh không hợp lệ';
  end if;

  update task_instances set status = 'pending_approval', submitted_at = now()
  where id = p_task_id returning * into v_task;

  if p_photo_path is not null then
    insert into task_photos (task_id, storage_path, uploaded_by) values (p_task_id, p_photo_path, auth.uid());
  end if;

  update disputes set status = 'resolved', resolved_at = now()
  where task_id = p_task_id and status = 'open';

  insert into task_events (task_id, event_type, actor_id) values (p_task_id, 'submitted', auth.uid());
  return v_task;
end;
$$;

-- ============================================================
-- K. dispute_task: chặn tự dispute, chặn dispute trùng, giới hạn 2 lần/task, reason_code preset
-- ============================================================
drop function if exists dispute_task(uuid, text);
create or replace function dispute_task(p_task_id uuid, p_reason_code text, p_reason text default null)
returns void language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  v_task task_instances;
begin
  if auth.uid() is null then raise exception 'Chưa đăng nhập'; end if;
  if p_reason_code not in ('not_clean', 'missing_photo', 'wrong_task', 'other') then
    raise exception 'reason_code không hợp lệ';
  end if;

  select * into v_task from task_instances where id = p_task_id for update;
  if v_task.id is null then raise exception 'Task không tồn tại'; end if;
  if not is_room_member(v_task.room_id) then raise exception 'Bạn không phải thành viên phòng này'; end if;
  if v_task.status <> 'pending_approval' then
    raise exception 'Chỉ có thể dispute task đang ở trạng thái chờ duyệt';
  end if;
  if v_task.claimed_by = auth.uid() then raise exception 'Không thể tự dispute việc của chính mình'; end if;
  if (select count(*) from disputes where task_id = p_task_id) >= 2 then
    raise exception 'Task này đã bị dispute 2 lần, cần Trưởng phòng phân xử';
  end if;

  insert into disputes (task_id, room_id, raised_by, reason_code, reason)
  values (p_task_id, v_task.room_id, auth.uid(), p_reason_code, p_reason);

  update task_instances set status = 'disputed' where id = p_task_id;

  -- actor_id NULL cố ý (ẩn danh). metadata chỉ chứa reason_code, KHÔNG chứa free text.
  insert into task_events (task_id, event_type, actor_id, metadata)
  values (p_task_id, 'disputed', null, jsonb_build_object('reason_code', p_reason_code));
end;
$$;

-- View công khai: thêm reason_code (preset) để người làm biết "chưa sạch" hay "thiếu ảnh"; vẫn KHÔNG có raised_by/reason
drop view if exists disputes_public;
create view disputes_public as
  select id, task_id, room_id, reason_code, status, created_at, resolved_at
  from disputes
  where is_room_member(room_id);
grant select on disputes_public to authenticated;

-- ============================================================
-- L. request_nudge: chặn tự nhắc mình, chỉ nhắc task đang có chủ, 1 lần/6h/người/task
-- ============================================================
create or replace function request_nudge(p_task_id uuid)
returns void language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  v_task task_instances;
begin
  if auth.uid() is null then raise exception 'Chưa đăng nhập'; end if;

  select * into v_task from task_instances where id = p_task_id;
  if v_task.id is null then raise exception 'Task không tồn tại'; end if;
  if not is_room_member(v_task.room_id) then raise exception 'Bạn không phải thành viên phòng này'; end if;
  if v_task.status not in ('claimed', 'assigned') then
    raise exception 'Chỉ nhắc được việc đang có người nhận và chưa nộp';
  end if;
  if v_task.claimed_by = auth.uid() then raise exception 'Không thể tự nhắc chính mình'; end if;
  if exists (select 1 from nudge_requests
             where task_id = p_task_id and requester_id = auth.uid()
               and created_at > now() - interval '6 hours') then
    raise exception 'Bạn vừa nhờ Bro nhắc việc này rồi, đợi thêm chút nhé';
  end if;

  insert into nudge_requests (room_id, task_id, requester_id)
  values (v_task.room_id, p_task_id, auth.uid());
end;
$$;

-- ============================================================
-- M. approve_task: tuần theo giờ VN + nhánh SOS Swap (Quyết định D1, Architecture v3 Mục 14)
-- ============================================================
create or replace function approve_task(p_task_id uuid)
returns void language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  v_task task_instances;
  v_week date;
  v_karma numeric;
begin
  select * into v_task from task_instances where id = p_task_id for update;
  if v_task.id is null then raise exception 'Task không tồn tại'; end if;
  if v_task.status <> 'pending_approval' then
    raise exception 'Task không ở trạng thái chờ duyệt (pending_approval)';
  end if;
  if exists (select 1 from point_ledger where task_id = p_task_id) then
    raise exception 'Task này đã được ghi điểm trước đó, không thể approve lần 2';
  end if;

  v_week := vn_week_start();
  v_karma := v_task.effort_points * 0.2;

  update task_instances set status = 'completed', approved_at = now() where id = p_task_id;

  insert into point_ledger (room_id, member_id, point_type, reason, amount, task_id, week_start)
  values (v_task.room_id, v_task.claimed_by, 'effort_weekly', 'task_base',
          v_task.effort_points * v_task.bonus_multiplier, p_task_id, v_week);
  insert into point_ledger (room_id, member_id, point_type, reason, amount, task_id, week_start)
  values (v_task.room_id, v_task.claimed_by, 'karma_permanent', 'task_base', v_karma, p_task_id, null);

  -- SOS Swap: người nhận hộ được +20% effort (điểm tuần) và +20% effort (karma) nữa
  if v_task.original_owner_id is not null then
    insert into point_ledger (room_id, member_id, point_type, reason, amount, task_id, week_start)
    values (v_task.room_id, v_task.claimed_by, 'effort_weekly', 'sos_rescue_bonus',
            v_task.effort_points * 0.2, p_task_id, v_week);
    insert into point_ledger (room_id, member_id, point_type, reason, amount, task_id, week_start)
    values (v_task.room_id, v_task.claimed_by, 'karma_permanent', 'swap_karma_bonus',
            v_task.effort_points * 0.2, p_task_id, null);
  end if;

  insert into task_events (task_id, event_type, actor_id) values (p_task_id, 'approved', null);
  insert into task_events (task_id, event_type, actor_id) values (p_task_id, 'completed', null);
end;
$$;

-- ============================================================
-- N. Feature Store: viết lại mv_member_features
-- Lỗi cũ (đã tái hiện): (1) completion_rate luôn = 0 vì không có event 'completed' nào được ghi;
-- (2) quota_progress_pct luôn NULL vì đọc qua view weekly_quota_progress có is_room_member() -> auth.uid() NULL khi cron refresh;
-- (3) join weekly_quota_progress nhiều tuần => nhiều dòng/thành viên => vỡ UNIQUE INDEX (room_id, member_id) khi REFRESH CONCURRENTLY.
-- Cách sửa: đọc thẳng point_ledger + task_instances, tổng hợp trước rồi mới join (1 dòng / thành viên / phòng).
-- ============================================================
drop materialized view if exists mv_member_features;
create materialized view mv_member_features as
with ts as (
  select room_id, claimed_by as member_id,
    count(*) filter (where status = 'completed') as completed_cnt,
    count(*) filter (where status = 'expired') as expired_cnt,
    count(*) filter (where status = 'completed' and submitted_at <= due_at) as ontime_cnt,
    avg(extract(epoch from (submitted_at - due_at)) / 3600.0)
      filter (where status = 'completed' and submitted_at > due_at) as avg_delay_hours,
    count(*) filter (where status in ('claimed', 'assigned', 'pending_approval', 'disputed')) as open_load
  from task_instances
  where claimed_by is not null
  group by room_id, claimed_by
),
dp as (
  select ti.room_id, ti.claimed_by as member_id, count(*) as dispute_cnt
  from disputes d join task_instances ti on ti.id = d.task_id
  where ti.claimed_by is not null
  group by ti.room_id, ti.claimed_by
),
wk as (
  select room_id, member_id, sum(amount) as achieved_points
  from point_ledger
  where point_type = 'effort_weekly' and week_start = vn_week_start()
  group by room_id, member_id
),
kr as (
  select member_id, sum(amount) as total_karma
  from point_ledger where point_type = 'karma_permanent'
  group by member_id
)
select
  rm.room_id, rm.member_id,
  coalesce(wk.achieved_points, 0)::float / nullif(wt.target_points, 0) as quota_progress_pct,
  coalesce(ts.completed_cnt, 0)::int as completed_cnt,
  coalesce(ts.expired_cnt, 0)::int as expired_cnt,
  coalesce(ts.ontime_cnt, 0)::int as ontime_cnt,
  ts.completed_cnt::float / nullif(ts.completed_cnt + ts.expired_cnt, 0) as completion_rate,
  ts.ontime_cnt::float / nullif(ts.completed_cnt + ts.expired_cnt, 0) as on_time_rate,
  ts.avg_delay_hours,
  coalesce(ts.open_load, 0)::int as open_load,
  coalesce(dp.dispute_cnt, 0)::int as dispute_cnt,
  coalesce(kr.total_karma, 0) as total_karma,
  rm.away_status, rm.is_new_member_until,
  extract(day from now() - rm.joined_at)::int as tenure_days
from room_members rm
left join ts on ts.room_id = rm.room_id and ts.member_id = rm.member_id
left join dp on dp.room_id = rm.room_id and dp.member_id = rm.member_id
left join wk on wk.room_id = rm.room_id and wk.member_id = rm.member_id
left join weekly_quota_targets wt on wt.room_id = rm.room_id and wt.member_id = rm.member_id and wt.week_start = vn_week_start()
left join kr on kr.member_id = rm.member_id
where rm.left_at is null;

create unique index idx_mv_member_features on mv_member_features (room_id, member_id);
revoke all on mv_member_features from anon, authenticated;

-- ============================================================
-- O. GRANT EXECUTE lại cho các RPC client thật sự cần (sau khi revoke ở mục B)
-- ============================================================
grant execute on function is_room_member(uuid) to authenticated;  -- RLS policy gọi bằng quyền invoker
grant execute on function create_room(text) to authenticated;
grant execute on function join_room(text) to authenticated;
grant execute on function leave_room(uuid, uuid) to authenticated;
grant execute on function claim_task(uuid) to authenticated;
grant execute on function submit_task(uuid, text) to authenticated;
grant execute on function dispute_task(uuid, text, text) to authenticated;
grant execute on function request_nudge(uuid) to authenticated;
grant execute on function propose_chore_template(uuid, text, text, int, int, text, boolean) to authenticated;
grant execute on function approve_chore_template(uuid) to authenticated;
-- KHÔNG grant: approve_task, process_silent_approvals, reset_expired_away_status, refresh_member_features, handle_new_user, vn_week_start(nội bộ)
grant execute on function vn_week_start(timestamptz) to authenticated, service_role;
grant execute on function approve_task(uuid) to service_role;
grant execute on function process_silent_approvals() to service_role;
grant execute on function reset_expired_away_status() to service_role;
grant execute on function refresh_member_features() to service_role;
