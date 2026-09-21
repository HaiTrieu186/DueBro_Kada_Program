-- Migration 015: Household core còn thiếu (App Core sở hữu). Đặc tả: ARCH Mục 4.3 + Mục 5.
-- Yêu cầu đã áp dụng 001-014. Không dùng giá trị enum mới trong file này (karma_redemption đã thêm ở 014).

-- ============ 1. Cấu hình & cột mới ============
create table if not exists app_config (
  key text primary key, value jsonb not null, updated_at timestamptz not null default now()
);
alter table app_config enable row level security;
drop policy if exists "app_config_read" on app_config;
create policy "app_config_read" on app_config for select to authenticated using (true);
revoke insert, update, delete on app_config from anon, authenticated;
insert into app_config(key, value) values
  ('weekly_target_points', '60'), ('newbie_target_points', '30'), ('volunteer_multiplier', '1.1'),
  ('karma_ratio', '0.2'), ('sos_bonus_ratio', '0.2'), ('photo_required_min_effort', '30'),
  ('silent_approve_hours', '6'), ('nudge_cooldown_hours', '6'), ('dispute_max_per_task', '2'),
  ('escalation_hours', '{"friendly":-24,"due":0,"sarcastic":12,"sos":36}'),
  ('expire_after_hours', '72'), ('auto_assign_within_hours', '24'), ('swap_limit_per_week', '2'),
  ('karma_rewards', '{"skip_next_task":30}')
on conflict (key) do nothing;

alter table chore_templates add column if not exists due_time time not null default '20:00';
alter table task_instances add column if not exists last_escalated_at timestamptz;
create index if not exists idx_task_status_due on task_instances (status, due_at);
create unique index if not exists uq_task_template_due on task_instances (template_id, due_at) where template_id is not null;
alter table karma_redemptions add column if not exists room_id uuid references rooms(id);
create unique index if not exists uq_swap_open_per_task on swap_requests (task_id) where status = 'open';

alter table notifications_log add column if not exists kind text not null default 'escalation'
  check (kind in ('escalation', 'nudge', 'system', 'match'));
alter table notifications_log add column if not exists push_status text not null default 'pending'
  check (push_status in ('pending', 'sent', 'failed', 'skipped'));
alter table notifications_log add column if not exists push_attempts int not null default 0;
alter table notifications_log add column if not exists is_llm boolean not null default false;
create index if not exists idx_notif_pending on notifications_log (sent_at) where push_status = 'pending';

-- D15: thông báo là việc riêng của người nhận
drop policy if exists "room_members_can_select_notifications" on notifications_log;
drop policy if exists "select_own_notifications" on notifications_log;
create policy "select_own_notifications" on notifications_log for select to authenticated
  using (recipient_id = auth.uid());
revoke insert, update, delete on notifications_log from anon, authenticated;

-- ============ 2. Helper nội bộ ============
create or replace function _notify(p_room uuid, p_recipient uuid, p_task uuid, p_level escalation_level, p_kind text, p_msg text)
returns void language sql security definer set search_path = public, pg_temp as $$
  insert into notifications_log (room_id, recipient_id, task_id, level, kind, message)
  values (p_room, p_recipient, p_task, p_level, p_kind, p_msg);
$$;
revoke execute on function _notify(uuid, uuid, uuid, escalation_level, text, text) from public, anon, authenticated;

create or replace function _bro_template(p_level escalation_level, p_title text)
returns text language sql immutable set search_path = public, pg_temp as $$
  select case p_level
    when 'friendly'  then 'Bro nhắc nhẹ: "' || p_title || '" sắp đến hạn rồi nha 🙂'
    when 'due'       then 'Đến hạn rồi nè! "' || p_title || '" đang chờ bạn đó.'
    when 'sarcastic' then '"' || p_title || '" đã trễ mà vẫn nằm im, chắc nó thích bạn lắm 😏'
    when 'sos'       then 'SOS! "' || p_title || '" trễ quá lâu. Nhờ bạn cùng phòng cứu hộ nhé?'
  end;
$$;

-- ============ 3. create_adhoc_task ============
create or replace function create_adhoc_task(
  p_room_id uuid, p_title text, p_category text, p_effort_points int, p_due_at timestamptz
) returns task_instances language plpgsql security definer set search_path = public, pg_temp as $$
declare v_task task_instances;
begin
  if auth.uid() is null then raise exception 'Chưa đăng nhập'; end if;
  if not is_room_member(p_room_id) then raise exception 'Bạn không phải thành viên phòng này'; end if;
  if length(trim(coalesce(p_title, ''))) < 2 then raise exception 'Tên việc quá ngắn'; end if;
  if p_effort_points not between 5 and 100 then raise exception 'Điểm Effort phải từ 5 đến 100'; end if;
  if p_due_at <= now() then raise exception 'Hạn chót phải ở tương lai'; end if;

  insert into task_instances (room_id, source, title, category, effort_points, requires_photo, due_at, created_by)
  values (p_room_id, 'adhoc', trim(p_title), p_category, p_effort_points, p_effort_points >= 30, p_due_at, auth.uid())
  returning * into v_task;
  insert into task_events (task_id, event_type, actor_id) values (v_task.id, 'created', auth.uid());
  return v_task;
end;
$$;

-- ============ 4. request_nudge: thêm thông báo ẩn danh cho người bị nhắc ============
create or replace function request_nudge(p_task_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_task task_instances;
begin
  if auth.uid() is null then raise exception 'Chưa đăng nhập'; end if;
  select * into v_task from task_instances where id = p_task_id;
  if v_task.id is null then raise exception 'Task không tồn tại'; end if;
  if not is_room_member(v_task.room_id) then raise exception 'Bạn không phải thành viên phòng này'; end if;
  if v_task.status not in ('claimed', 'assigned') then
    raise exception 'Chỉ nhắc được việc đang có người nhận và chưa nộp';
  end if;
  if v_task.claimed_by = auth.uid() then raise exception 'Không thể tự nhắc chính mình'; end if;
  if exists (select 1 from nudge_requests where task_id = p_task_id and requester_id = auth.uid()
             and created_at > now() - interval '6 hours') then
    raise exception 'Bạn vừa nhờ Bro nhắc việc này rồi, đợi thêm chút nhé';
  end if;
  insert into nudge_requests (room_id, task_id, requester_id) values (v_task.room_id, p_task_id, auth.uid());
  -- Nội dung KHÔNG chứa danh tính người nhắc
  perform _notify(v_task.room_id, v_task.claimed_by, p_task_id, 'friendly', 'nudge',
                  'Có bạn cùng phòng nhờ Bro nhắc: "' || v_task.title || '" nhé 👀');
end;
$$;

-- ============ 5. escalate_tasks (cron 15') ============
create or replace function escalate_tasks() returns int
language plpgsql security definer set search_path = public, pg_temp as $$
declare r record; m record; v_h numeric; v_level escalation_level; v_n int := 0; v_msg text;
begin
  for r in select * from task_instances where status in ('open', 'claimed', 'assigned') loop
    v_h := extract(epoch from (now() - r.due_at)) / 3600.0;
    v_level := case when v_h >= 36 then 'sos'::escalation_level when v_h >= 12 then 'sarcastic'
                    when v_h >= 0 then 'due' when v_h >= -24 then 'friendly' else null end;
    continue when v_level is null;
    continue when r.last_escalation_level is not null and v_level <= r.last_escalation_level;
    continue when r.status = 'open' and v_level in ('sarcastic', 'sos');   -- việc chưa ai nhận chỉ nhắc friendly/due

    update task_instances set last_escalation_level = v_level, last_escalated_at = now() where id = r.id;
    insert into task_events (task_id, event_type, metadata)
    values (r.id, 'escalation_sent', jsonb_build_object('level', v_level));
    v_msg := _bro_template(v_level, r.title);

    if r.claimed_by is not null then
      perform _notify(r.room_id, r.claimed_by, r.id, v_level, 'escalation', v_msg);
      v_n := v_n + 1;
    else
      for m in select member_id from room_members
               where room_id = r.room_id and left_at is null and away_status = 'active' loop
        perform _notify(r.room_id, m.member_id, r.id, v_level, 'escalation',
                        'Việc "' || r.title || '" chưa ai nhận đó, ai xung phong nào?');
        v_n := v_n + 1;
      end loop;
    end if;
  end loop;
  return v_n;
end;
$$;

-- ============ 6. expire_tasks (cron 30') ============
create or replace function expire_tasks() returns int
language plpgsql security definer set search_path = public, pg_temp as $$
declare r record; v_n int := 0;
begin
  for r in select * from task_instances
           where status in ('open', 'claimed', 'assigned') and now() > due_at + interval '72 hours'
           for update skip locked loop
    update task_instances set status = 'expired' where id = r.id;
    insert into task_events (task_id, event_type, actor_id) values (r.id, 'expired', null);
    if r.claimed_by is not null then
      insert into point_ledger (room_id, member_id, point_type, reason, amount, task_id)
      values (r.room_id, r.claimed_by, 'karma_permanent', 'penalty', -(r.effort_points * 0.2), r.id);
      perform _notify(r.room_id, r.claimed_by, r.id, null, 'system',
                      'Việc "' || r.title || '" đã hết hạn. Bro trừ chút Karma, lần sau nhớ nha.');
    end if;
    v_n := v_n + 1;
  end loop;
  return v_n;
end;
$$;

-- ============ 7. Hàng đợi thông báo cho Edge Function (service) ============
create or replace function claim_pending_notifications(p_limit int default 50)
returns setof notifications_log language sql security definer set search_path = public, pg_temp as $$
  with c as (
    select id from notifications_log where push_status = 'pending' and push_attempts < 3
    order by sent_at limit p_limit for update skip locked
  )
  update notifications_log n set push_attempts = n.push_attempts + 1 from c where n.id = c.id returning n.*;
$$;

-- ============ 8. Away Mode ============
create or replace function set_away_mode(p_room_id uuid, p_from date, p_to date) returns room_members
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_row room_members;
begin
  if auth.uid() is null then raise exception 'Chưa đăng nhập'; end if;
  if p_from is null or p_to is null or p_from > p_to then raise exception 'Khoảng ngày không hợp lệ'; end if;
  if p_to - p_from > 30 then raise exception 'Away tối đa 30 ngày'; end if;
  update room_members set away_status = 'away', away_from = p_from, away_to = p_to
  where room_id = p_room_id and member_id = auth.uid() and left_at is null returning * into v_row;
  if v_row.member_id is null then raise exception 'Bạn không phải thành viên phòng này'; end if;
  return v_row;
end;
$$;
create or replace function clear_away_mode(p_room_id uuid) returns room_members
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_row room_members;
begin
  if auth.uid() is null then raise exception 'Chưa đăng nhập'; end if;
  update room_members set away_status = 'active', away_from = null, away_to = null
  where room_id = p_room_id and member_id = auth.uid() and left_at is null returning * into v_row;
  if v_row.member_id is null then raise exception 'Bạn không phải thành viên phòng này'; end if;
  return v_row;
end;
$$;
create or replace function reset_expired_away_status() returns int
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_n int;
begin
  update room_members set away_status = 'active', away_from = null, away_to = null
  where away_status = 'away' and away_to < (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- ============ 9. SOS Swap ============
create or replace function request_swap(p_task_id uuid) returns swap_requests
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_task task_instances; v_swap swap_requests; v_name text; m record;
begin
  if auth.uid() is null then raise exception 'Chưa đăng nhập'; end if;
  select * into v_task from task_instances where id = p_task_id for update;
  if v_task.id is null then raise exception 'Task không tồn tại'; end if;
  if v_task.claimed_by is distinct from auth.uid() then raise exception 'Chỉ chủ việc mới được nhờ cứu'; end if;
  if v_task.status not in ('claimed', 'assigned') then raise exception 'Việc không ở trạng thái có thể nhờ cứu'; end if;
  if (select count(*) from swap_requests
      where requested_by = auth.uid()
        and created_at >= (vn_week_start()::timestamp at time zone 'Asia/Ho_Chi_Minh')) >= 2 then
    raise exception 'Bạn đã dùng hết 2 lượt nhờ cứu trong tuần này';
  end if;
  insert into swap_requests (task_id, requested_by) values (p_task_id, auth.uid()) returning * into v_swap;
  select display_name into v_name from profiles where id = auth.uid();
  for m in select member_id from room_members
           where room_id = v_task.room_id and left_at is null and away_status = 'active' and member_id <> auth.uid() loop
    perform _notify(v_task.room_id, m.member_id, p_task_id, 'sos', 'system',
                    v_name || ' đang cần cứu việc "' || v_task.title || '". Ai nhận hộ nào?');
  end loop;
  return v_swap;
end;
$$;

create or replace function accept_swap(p_swap_id uuid) returns task_instances
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_swap swap_requests; v_task task_instances;
begin
  if auth.uid() is null then raise exception 'Chưa đăng nhập'; end if;
  select * into v_swap from swap_requests where id = p_swap_id for update;
  if v_swap.id is null or v_swap.status <> 'open' then raise exception 'Yêu cầu không còn mở'; end if;
  select * into v_task from task_instances where id = v_swap.task_id for update;
  if not is_room_member(v_task.room_id) then raise exception 'Bạn không phải thành viên phòng này'; end if;
  if v_swap.requested_by = auth.uid() then raise exception 'Không thể tự nhận việc mình nhờ cứu'; end if;
  if v_task.status not in ('claimed', 'assigned') then raise exception 'Việc không còn ở trạng thái có thể nhận hộ'; end if;
  if exists (select 1 from room_members where room_id = v_task.room_id and member_id = auth.uid() and away_status = 'away') then
    raise exception 'Bạn đang ở chế độ Away';
  end if;

  update task_instances set original_owner_id = v_swap.requested_by, claimed_by = auth.uid(),
         claimed_at = now(), assignment_method = 'sos_swap', bonus_multiplier = 1.0, status = 'claimed'
  where id = v_task.id returning * into v_task;
  update swap_requests set status = 'accepted', accepted_by = auth.uid(), accepted_at = now() where id = p_swap_id;
  insert into task_events (task_id, event_type, actor_id, metadata)
  values (v_task.id, 'swapped', auth.uid(), jsonb_build_object('from', v_swap.requested_by));
  perform _notify(v_task.room_id, v_swap.requested_by, v_task.id, null, 'system',
                  'Có bạn cùng phòng đã nhận hộ việc "' || v_task.title || '". Nhớ cảm ơn nha!');
  return v_task;
end;
$$;

create or replace function cancel_swap(p_swap_id uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update swap_requests set status = 'cancelled' where id = p_swap_id and requested_by = auth.uid() and status = 'open';
  if not found then raise exception 'Không huỷ được yêu cầu này'; end if;
end;
$$;

-- ============ 10. Host phân xử dispute ============
create or replace function resolve_dispute(p_task_id uuid, p_decision text) returns task_instances
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_task task_instances; v_role member_role;
begin
  if p_decision not in ('uphold', 'dismiss') then raise exception 'decision phải là uphold hoặc dismiss'; end if;
  select * into v_task from task_instances where id = p_task_id for update;
  if v_task.id is null then raise exception 'Task không tồn tại'; end if;
  select role into v_role from room_members where room_id = v_task.room_id and member_id = auth.uid() and left_at is null;
  if v_role is distinct from 'host' then raise exception 'Chỉ Trưởng phòng mới được phân xử'; end if;
  if v_task.status <> 'disputed' then raise exception 'Việc không ở trạng thái disputed'; end if;

  if p_decision = 'uphold' then
    update task_instances set status = 'claimed' where id = p_task_id returning * into v_task;   -- phải làm lại
  else
    update task_instances set status = 'pending_approval', submitted_at = now() where id = p_task_id returning * into v_task;
  end if;
  update disputes set status = 'resolved', resolved_at = now() where task_id = p_task_id and status = 'open';
  insert into task_events (task_id, event_type, actor_id, metadata)
  values (p_task_id, 'dispute_resolved', auth.uid(), jsonb_build_object('decision', p_decision));
  return v_task;
end;
$$;

-- ============ 11. Karma Shop ============
create or replace function redeem_karma(p_room_id uuid, p_reward_type text) returns karma_redemptions
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_cost numeric; v_bal numeric; v_row karma_redemptions;
begin
  if auth.uid() is null then raise exception 'Chưa đăng nhập'; end if;
  if not is_room_member(p_room_id) then raise exception 'Bạn không phải thành viên phòng này'; end if;
  select (value ->> p_reward_type)::numeric into v_cost from app_config where key = 'karma_rewards';
  if v_cost is null then raise exception 'Phần thưởng không tồn tại'; end if;
  if exists (select 1 from karma_redemptions where member_id = auth.uid() and room_id = p_room_id
             and reward_type = p_reward_type and used_at is null) then
    raise exception 'Bạn còn 1 phần thưởng chưa dùng';
  end if;
  perform 1 from profiles where id = auth.uid() for update;      -- khoá tuần tự hoá đổi thưởng cùng lúc
  select coalesce(sum(amount), 0) into v_bal from point_ledger where member_id = auth.uid() and point_type = 'karma_permanent';
  if v_bal < v_cost then raise exception 'Không đủ Karma (cần %, đang có %)', v_cost, v_bal; end if;

  insert into karma_redemptions (member_id, room_id, reward_type, karma_cost)
  values (auth.uid(), p_room_id, p_reward_type, v_cost) returning * into v_row;
  insert into point_ledger (room_id, member_id, point_type, reason, amount)
  values (p_room_id, auth.uid(), 'karma_permanent', 'karma_redemption', -v_cost);
  return v_row;
end;
$$;

-- ============ 12. Nội bộ cho Auto-Assign (service) ============
create or replace function assign_task(p_task_id uuid, p_member_id uuid, p_method text default 'auto_rule_v1')
returns task_instances language plpgsql security definer set search_path = public, pg_temp as $$
declare v_task task_instances;
begin
  update task_instances set status = 'assigned', claimed_by = p_member_id, claimed_at = now(),
         assignment_method = p_method, bonus_multiplier = 1.0
  where id = p_task_id and status = 'open'
    and exists (select 1 from room_members rm where rm.room_id = task_instances.room_id
                and rm.member_id = p_member_id and rm.left_at is null and rm.away_status = 'active')
  returning * into v_task;
  if v_task.id is null then raise exception 'Không giao được (task không mở hoặc thành viên không hợp lệ)'; end if;
  insert into task_events (task_id, event_type, actor_id, metadata)
  values (p_task_id, 'auto_assigned', null, jsonb_build_object('member', p_member_id, 'method', p_method));
  perform _notify(v_task.room_id, p_member_id, p_task_id, 'friendly', 'system',
                  'Bro giao việc "' || v_task.title || '" cho bạn nè. Hạn chót đã có trong app.');
  return v_task;
end;
$$;

create or replace function consume_skip_redemption(p_room_id uuid, p_member_id uuid) returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid;
begin
  select id into v_id from karma_redemptions
  where room_id = p_room_id and member_id = p_member_id and reward_type = 'skip_next_task' and used_at is null
  order by redeemed_at limit 1 for update skip locked;
  if v_id is null then return false; end if;
  update karma_redemptions set used_at = now() where id = v_id;
  return true;
end;
$$;

-- ============ 13. Mục tiêu tuần ============
create or replace function generate_weekly_targets() returns int
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_ws date := vn_week_start(); v_n int;
begin
  insert into weekly_quota_targets (room_id, member_id, week_start, target_points)
  select rm.room_id, rm.member_id, v_ws,
    case when rm.is_new_member_until is not null and rm.is_new_member_until > now() then 30
         else round(60.0 * (7 - coalesce(
                case when rm.away_status = 'away' and rm.away_from is not null and rm.away_to is not null
                     then greatest(0, least(rm.away_to, v_ws + 6) - greatest(rm.away_from, v_ws) + 1) end, 0)) / 7.0)::int end
  from room_members rm where rm.left_at is null
  on conflict (room_id, member_id, week_start) do nothing;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- ============ 14. Quyền thực thi ============
-- LƯU Ý (đã tái hiện): Supabase mặc định tự cấp EXECUTE cho anon/authenticated/service_role trên hàm MỚI tạo.
-- Vì vậy phải revoke TƯỜNG MINH khỏi authenticated với mọi hàm chỉ dành cho cron/service.
revoke execute on all functions in schema public from public, anon;
-- Từ giờ mọi hàm mới KHÔNG tự động mở cho client: phải `grant execute ... to authenticated` tường minh khi client cần.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
revoke execute on function escalate_tasks(), expire_tasks(), claim_pending_notifications(int),
  assign_task(uuid, uuid, text), consume_skip_redemption(uuid, uuid), generate_weekly_targets(),
  reset_expired_away_status(), handle_new_user() from authenticated;
grant execute on function create_adhoc_task(uuid, text, text, int, timestamptz) to authenticated;
grant execute on function request_nudge(uuid) to authenticated;
grant execute on function set_away_mode(uuid, date, date) to authenticated;
grant execute on function clear_away_mode(uuid) to authenticated;
grant execute on function request_swap(uuid) to authenticated;
grant execute on function accept_swap(uuid) to authenticated;
grant execute on function cancel_swap(uuid) to authenticated;
grant execute on function resolve_dispute(uuid, text) to authenticated;
grant execute on function redeem_karma(uuid, text) to authenticated;
-- Chỉ service_role / cron
grant execute on function escalate_tasks() to service_role;
grant execute on function expire_tasks() to service_role;
grant execute on function claim_pending_notifications(int) to service_role;
grant execute on function assign_task(uuid, uuid, text) to service_role;
grant execute on function consume_skip_redemption(uuid, uuid) to service_role;
grant execute on function generate_weekly_targets() to service_role;
grant execute on function reset_expired_away_status() to service_role;
-- Giữ nguyên quyền client của các hàm đã có ở 014 (revoke-all ở trên đã xoá EXECUTE của PUBLIC, không đụng grant tường minh)

-- ============ 15. Lịch cron (UTC) — mẫu idempotent như 013 ============
do $$
declare j text;
begin
  foreach j in array array['job_escalate_tasks_15m','job_expire_tasks_30m','job_generate_weekly_targets','job_reset_expired_away_daily'] loop
    if exists (select 1 from cron.job where jobname = j) then perform cron.unschedule(j); end if;
  end loop;
end $$;
select cron.schedule('job_escalate_tasks_15m', '*/15 * * * *', 'select escalate_tasks();');
select cron.schedule('job_expire_tasks_30m', '5,35 * * * *', 'select expire_tasks();');
select cron.schedule('job_generate_weekly_targets', '5 17 * * 0', 'select generate_weekly_targets();');   -- Thứ Hai 00:05 VN
select cron.schedule('job_reset_expired_away_daily', '1 17 * * *', 'select reset_expired_away_status();'); -- 00:01 VN
-- Các job gọi Edge Function (dispatch-notifications, auto-assign-tasks, generate-recurring-tasks) tạo ở migration riêng
-- SAU khi đã lưu project_url/service_role_key vào Vault (mẫu ở ARCH Mục 8.2).
