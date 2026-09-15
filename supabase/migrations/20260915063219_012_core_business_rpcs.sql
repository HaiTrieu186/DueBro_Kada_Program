-- Migration 012: Core business RPCs (claim_task, submit_task, approve_task, dispute_task,
-- request_nudge, join_room, leave_room) + fix RLS gap ở task_events + trigger reopen task
-- khi member rời phòng (đúng theo Architecture Mục 6.2, 6.5, 6.6, 6.10, 4.4).

-- ============ FIX GAP: task_events chưa bật RLS (bị bỏ sót ở migration 008) ============
alter table task_events enable row level security;
-- Không tạo policy select cho 'authenticated' -> deny toàn bộ qua PostgREST.
-- task_events là audit log + dữ liệu train ML, không cần client đọc trực tiếp,
-- chỉ đọc qua service_role (ML pipeline, Admin Dashboard).

-- ============ claim_task (Mục 6.2) ============
create or replace function claim_task(p_task_id uuid)
returns task_instances
language plpgsql security definer as $$
declare v_task task_instances;
begin
  update task_instances
  set status = 'claimed', claimed_by = auth.uid(), claimed_at = now(),
      assignment_method = 'volunteer', bonus_multiplier = 1.1
  where id = p_task_id and status = 'open'
  returning * into v_task;

  if v_task.id is null then
    raise exception 'Task đã được người khác nhận hoặc không còn ở trạng thái mở';
  end if;

  insert into task_events(task_id, event_type, actor_id) values (p_task_id, 'claimed', auth.uid());
  return v_task;
end;
$$;

-- ============ submit_task (Mục 6.5) ============
create or replace function submit_task(p_task_id uuid, p_photo_path text default null)
returns task_instances
language plpgsql security definer as $$
declare
  v_task task_instances;
begin
  select * into v_task from task_instances where id = p_task_id for update;

  if v_task.id is null then
    raise exception 'Task không tồn tại';
  end if;

  if v_task.claimed_by is distinct from auth.uid() then
    raise exception 'Chỉ người được gán/nhận task mới được submit';
  end if;

  if v_task.status not in ('claimed', 'assigned', 'disputed') then
    raise exception 'Task không ở trạng thái có thể submit';
  end if;

  if v_task.requires_photo and p_photo_path is null then
    raise exception 'Task này bắt buộc phải có ảnh xác thực';
  end if;

  update task_instances
  set status = 'pending_approval', submitted_at = now()
  where id = p_task_id
  returning * into v_task;

  if p_photo_path is not null then
    insert into task_photos (task_id, storage_path, uploaded_by)
    values (p_task_id, p_photo_path, auth.uid());
  end if;

  insert into task_events(task_id, event_type, actor_id) values (p_task_id, 'submitted', auth.uid());
  return v_task;
end;
$$;

-- ============ approve_task (Mục 4.4, 6.5) — internal, chỉ cron gọi ============
create or replace function approve_task(p_task_id uuid)
returns void
language plpgsql security definer as $$
declare
  v_task task_instances;
  v_week_start date;
  v_karma_amount numeric;
begin
  select * into v_task from task_instances where id = p_task_id for update;

  if v_task.id is null then
    raise exception 'Task không tồn tại';
  end if;

  if v_task.status <> 'pending_approval' then
    raise exception 'Task không ở trạng thái chờ duyệt (pending_approval)';
  end if;

  -- Chặn ghi điểm 2 lần cho cùng 1 task (ràng buộc bắt buộc, Mục 4.4)
  if exists (select 1 from point_ledger where task_id = p_task_id) then
    raise exception 'Task này đã được ghi điểm trước đó, không thể approve lần 2';
  end if;

  v_week_start := date_trunc('week', now())::date;
  v_karma_amount := v_task.effort_points * 0.2; -- 20% effort_points, đúng Mục 6.7
  -- TODO ❓: nếu v_task.original_owner_id is not null (task này là SOS Swap, Mục 6.9),
  -- BRD nói người nhận hộ được thêm "bonus karma hỗ trợ" nhưng KHÔNG có con số cụ thể.
  -- Chưa cộng thêm gì ở đây -- chờ xác nhận từ chủ dự án trước khi bổ sung logic này.

  update task_instances
  set status = 'completed', approved_at = now()
  where id = p_task_id;

  insert into point_ledger (room_id, member_id, point_type, reason, amount, task_id, week_start)
  values (v_task.room_id, v_task.claimed_by, 'effort_weekly', 'task_base',
          v_task.effort_points * v_task.bonus_multiplier, p_task_id, v_week_start);

  insert into point_ledger (room_id, member_id, point_type, reason, amount, task_id, week_start)
  values (v_task.room_id, v_task.claimed_by, 'karma_permanent', 'task_base',
          v_karma_amount, p_task_id, null);

  insert into task_events(task_id, event_type, actor_id) values (p_task_id, 'approved', null);
end;
$$;

-- ============ dispute_task (Mục 6.6, ẩn danh) ============
create or replace function dispute_task(p_task_id uuid, p_reason text default null)
returns void
language plpgsql security definer as $$
declare
  v_room_id uuid;
  v_status task_status;
begin
  select room_id, status into v_room_id, v_status from task_instances where id = p_task_id;

  if v_room_id is null then
    raise exception 'Task không tồn tại';
  end if;

  if not is_room_member(v_room_id) then
    raise exception 'Bạn không phải thành viên phòng này';
  end if;

  if v_status <> 'pending_approval' then
    raise exception 'Chỉ có thể dispute task đang ở trạng thái chờ duyệt';
  end if;

  insert into disputes (task_id, room_id, raised_by, reason)
  values (p_task_id, v_room_id, auth.uid(), p_reason);

  update task_instances set status = 'disputed' where id = p_task_id;

  -- actor_id để NULL cố ý -- ghi actor_id thật ở đây sẽ lộ danh tính người dispute
  -- nếu task_events từng bị lộ qua đường khác sau này (xem cảnh báo Mục 9.3)
  insert into task_events(task_id, event_type, actor_id, metadata)
  values (p_task_id, 'disputed', null, jsonb_build_object('reason', p_reason));
end;
$$;

-- ============ request_nudge (Mục 6.6, ẩn danh) ============
create or replace function request_nudge(p_task_id uuid)
returns void
language plpgsql security definer as $$
declare
  v_room_id uuid;
begin
  select room_id into v_room_id from task_instances where id = p_task_id;

  if v_room_id is null then
    raise exception 'Task không tồn tại';
  end if;

  if not is_room_member(v_room_id) then
    raise exception 'Bạn không phải thành viên phòng này';
  end if;

  insert into nudge_requests (room_id, task_id, requester_id)
  values (v_room_id, p_task_id, auth.uid());
end;
$$;

-- ============ join_room (Mục 6.10) ============
create or replace function join_room(p_invite_code text)
returns room_members
language plpgsql security definer as $$
declare
  v_room rooms;
  v_current_members int;
  v_row room_members;
begin
  select * into v_room from rooms where invite_code = p_invite_code;

  if v_room.id is null then
    raise exception 'Mã mời không hợp lệ';
  end if;

  select count(*) into v_current_members from room_members
  where room_id = v_room.id and left_at is null;

  if v_current_members >= v_room.max_members then
    raise exception 'Phòng đã đầy (tối đa % thành viên)', v_room.max_members;
  end if;

  if exists (select 1 from room_members where room_id = v_room.id and member_id = auth.uid() and left_at is null) then
    raise exception 'Bạn đã ở trong phòng này rồi';
  end if;

  insert into room_members (room_id, member_id, role, is_new_member_until)
  values (v_room.id, auth.uid(), 'member', now() + interval '7 days')
  returning * into v_row;

  -- Chính sách "Tân binh": target_points = 30 (50% của 60), Mục 6.10
  insert into weekly_quota_targets (room_id, member_id, week_start, target_points)
  values (v_room.id, auth.uid(), date_trunc('week', now())::date, 30)
  on conflict (room_id, member_id, week_start) do nothing;

  return v_row;
end;
$$;

-- ============ leave_room (Mục 6.10) ============
create or replace function leave_room(p_room_id uuid, p_new_host_id uuid default null)
returns void
language plpgsql security definer as $$
declare
  v_role member_role;
begin
  select role into v_role from room_members
  where room_id = p_room_id and member_id = auth.uid() and left_at is null;

  if v_role is null then
    raise exception 'Bạn không phải thành viên phòng này';
  end if;

  if v_role = 'host' then
    if p_new_host_id is null then
      raise exception 'Là Trưởng phòng, bạn phải chỉ định host mới trước khi rời phòng';
    end if;

    if not exists (
      select 1 from room_members
      where room_id = p_room_id and member_id = p_new_host_id and left_at is null
    ) then
      raise exception 'Host mới phải là thành viên đang hoạt động trong phòng';
    end if;

    update room_members set role = 'host' where room_id = p_room_id and member_id = p_new_host_id;
  end if;

  update room_members set left_at = now()
  where room_id = p_room_id and member_id = auth.uid();
end;
$$;

-- Trigger tự mở lại task khi member rời phòng (đúng theo Mục 6.10: "trigger AFTER UPDATE
-- khi left_at được set" -- KHÔNG viết logic này inline trong leave_room, tách riêng
-- để bất kỳ đường nào set left_at cũng tự động trigger, không chỉ qua RPC này).
create or replace function reopen_tasks_on_member_leave()
returns trigger language plpgsql as $$
begin
  if new.left_at is not null and old.left_at is null then
    update task_instances
    set status = 'open', claimed_by = null, claimed_at = null, assignment_method = null
    where room_id = new.room_id and claimed_by = new.member_id
      and status in ('claimed', 'assigned');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_reopen_tasks_on_member_leave on room_members;
create trigger trg_reopen_tasks_on_member_leave
after update of left_at on room_members
for each row execute function reopen_tasks_on_member_leave();

-- ============ Phân quyền EXECUTE ============
-- approve_task CHỈ được gọi bởi cron/service_role, KHÔNG expose cho client (đúng Mục 8)
revoke execute on function approve_task(uuid) from public, authenticated, anon;

grant execute on function claim_task(uuid) to authenticated;
grant execute on function submit_task(uuid, text) to authenticated;
grant execute on function dispute_task(uuid, text) to authenticated;
grant execute on function request_nudge(uuid) to authenticated;
grant execute on function join_room(text) to authenticated;
grant execute on function leave_room(uuid, uuid) to authenticated;
