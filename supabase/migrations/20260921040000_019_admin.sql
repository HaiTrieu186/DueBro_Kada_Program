-- ===== 019_admin.sql (Web Admin sở hữu) =====
-- Architecture Section 4.6 & Section 10: Admin Operations, Analytics & Demo Controls

-- 1. Xác thực quyền Ops (App Metadata custom claim)
create or replace function is_ops() returns boolean language sql stable
set search_path = public, pg_temp as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'ops', false);
$$;
revoke execute on function is_ops() from public, anon;
grant execute on function is_ops() to authenticated;

-- 2. Bảng app_events & RPC track_event cho DAU/WAU & Funnel
create table if not exists app_events (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete set null,
  event text not null,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_app_events_time on app_events (created_at desc);
create index if not exists idx_app_events_user_event on app_events (user_id, event);

alter table app_events enable row level security;
drop policy if exists "app_events_select_ops" on app_events;
create policy "app_events_select_ops" on app_events for select to authenticated using (is_ops());
revoke insert, update, delete on app_events from anon, authenticated;

create or replace function track_event(p_event text, p_props jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_event not in (
    'app_open', 'onboarding_done', 'profile_saved', 'match_viewed',
    'swipe', 'chat_sent', 'room_created', 'task_claimed', 'task_submitted'
  ) then
    raise exception 'Event không hợp lệ';
  end if;
  insert into app_events (user_id, event, props)
  values (auth.uid(), p_event, coalesce(p_props, '{}'::jsonb));
end;
$$;
revoke execute on function track_event(text, jsonb) from public, anon;
grant execute on function track_event(text, jsonb) to authenticated;

-- 3. admin_kpi_overview
create or replace function admin_kpi_overview() returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_total_users int;
  v_dau int;
  v_wau int;
  v_total_rooms int;
  v_active_tasks_this_week int;
  v_on_time_rate numeric;
  v_dispute_rate numeric;
  v_silent_approval_rate numeric;
  v_total_llm_cost numeric;
  v_total_llm_calls_today int;
  v_fallback_rate numeric;
  v_ws date := vn_week_start();
  v_completed_ontime int;
  v_resolved int;
  v_dispute_cnt int;
  v_submitted_cnt int;
  v_silent_cnt int;
  v_total_calls int;
  v_fallback_cnt int;
begin
  if not is_ops() then raise exception 'forbidden'; end if;

  select count(*) into v_total_users from profiles;
  select count(distinct user_id) into v_dau from app_events
  where event = 'app_open' and created_at >= (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  select count(distinct user_id) into v_wau from app_events
  where event = 'app_open' and created_at >= (v_ws::timestamp at time zone 'Asia/Ho_Chi_Minh');
  select count(*) into v_total_rooms from rooms;
  select count(*) into v_active_tasks_this_week from task_instances
  where created_at >= (v_ws::timestamp at time zone 'Asia/Ho_Chi_Minh');

  select count(*) filter (where status = 'completed' and submitted_at <= due_at),
         count(*) filter (where status in ('completed', 'expired'))
  into v_completed_ontime, v_resolved
  from task_instances;

  v_on_time_rate := case when v_resolved > 0 then round(v_completed_ontime::numeric / v_resolved, 2) else 1.00 end;

  select count(*) into v_dispute_cnt from disputes;
  select count(*) into v_submitted_cnt from task_events where event_type = 'submitted';
  v_dispute_rate := case when v_submitted_cnt > 0 then round(v_dispute_cnt::numeric / v_submitted_cnt, 2) else 0.00 end;

  select count(*) into v_silent_cnt from task_instances ti
  where ti.status = 'completed' and not exists (select 1 from disputes d where d.task_id = ti.id);
  v_silent_approval_rate := case when v_resolved > 0 then round(v_silent_cnt::numeric / v_resolved, 2) else 1.00 end;

  select count(*), count(*) filter (where fallback_used)
  into v_total_calls, v_fallback_cnt
  from llm_usage_log
  where created_at >= (now() at time zone 'Asia/Ho_Chi_Minh')::date;

  v_fallback_rate := case when v_total_calls > 0 then round(v_fallback_cnt::numeric / v_total_calls, 2) else 0.00 end;
  v_total_llm_calls_today := v_total_calls;

  select coalesce(round(sum(coalesce(input_tokens, 0) * 0.00000015 + coalesce(output_tokens, 0) * 0.00000060), 4), 0.00)
  into v_total_llm_cost
  from llm_usage_log;

  return jsonb_build_object(
    'total_users', v_total_users,
    'dau', v_dau,
    'wau', v_wau,
    'total_rooms', v_total_rooms,
    'active_tasks_this_week', v_active_tasks_this_week,
    'on_time_rate', v_on_time_rate,
    'dispute_rate', v_dispute_rate,
    'silent_approval_rate', v_silent_approval_rate,
    'total_llm_cost_usd', v_total_llm_cost,
    'total_llm_calls_today', v_total_llm_calls_today,
    'fallback_rate', v_fallback_rate
  );
end;
$$;
revoke execute on function admin_kpi_overview() from public, anon;
grant execute on function admin_kpi_overview() to authenticated;

-- 4. admin_timeseries
create or replace function admin_timeseries(p_metric text, p_days int default 14)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_res jsonb;
begin
  if not is_ops() then raise exception 'forbidden'; end if;
  if p_days < 1 or p_days > 90 then raise exception 'p_days không hợp lệ'; end if;

  if p_metric = 'dau' then
    select jsonb_agg(d order by d->>'date') into v_res
    from (
      select to_char(date_trunc('day', created_at at time zone 'Asia/Ho_Chi_Minh'), 'YYYY-MM-DD') as date,
             count(distinct user_id) as value
      from app_events
      where event = 'app_open' and created_at >= (now() - (p_days || ' days')::interval)
      group by 1
    ) d;
  elsif p_metric = 'tasks_completed' then
    select jsonb_agg(d order by d->>'date') into v_res
    from (
      select to_char(date_trunc('day', created_at at time zone 'Asia/Ho_Chi_Minh'), 'YYYY-MM-DD') as date,
             count(*) as value
      from task_events
      where event_type = 'completed' and created_at >= (now() - (p_days || ' days')::interval)
      group by 1
    ) d;
  elsif p_metric = 'matches' then
    select jsonb_agg(d order by d->>'date') into v_res
    from (
      select to_char(date_trunc('day', created_at at time zone 'Asia/Ho_Chi_Minh'), 'YYYY-MM-DD') as date,
             count(*) as value
      from match_connections
      where created_at >= (now() - (p_days || ' days')::interval)
      group by 1
    ) d;
  else
    raise exception 'Metric không hợp lệ (dau, tasks_completed, matches)';
  end if;

  return coalesce(v_res, '[]'::jsonb);
end;
$$;
revoke execute on function admin_timeseries(text, int) from public, anon;
grant execute on function admin_timeseries(text, int) to authenticated;

-- 5. admin_matching_funnel
create or replace function admin_matching_funnel() returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_users int; v_profiles int; v_swiped int; v_matched int; v_chatted int; v_housed int;
begin
  if not is_ops() then raise exception 'forbidden'; end if;
  select count(*) into v_users from profiles;
  select count(*) into v_profiles from lifestyle_profiles;
  select count(distinct user_id) into v_swiped from match_actions;
  select count(distinct user_a_id) + count(distinct user_b_id) into v_matched from match_connections;
  select count(distinct sender_id) into v_chatted from messages;
  select count(*) into v_housed from match_connections where status = 'housed';

  return jsonb_build_object(
    'total_registered', v_users,
    'profiles_completed', v_profiles,
    'users_swiped', v_swiped,
    'connections_formed', v_matched,
    'users_chatted', v_chatted,
    'rooms_created_from_match', v_housed
  );
end;
$$;
revoke execute on function admin_matching_funnel() from public, anon;
grant execute on function admin_matching_funnel() to authenticated;

-- 6. admin_household_health
create or replace function admin_household_health() returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_overdue int; v_total_active int; v_rooms jsonb;
begin
  if not is_ops() then raise exception 'forbidden'; end if;
  select count(*) into v_overdue from task_instances
  where status in ('open', 'claimed', 'assigned') and due_at < now();
  select count(*) into v_total_active from task_instances
  where status in ('open', 'claimed', 'assigned', 'pending_approval', 'disputed');

  select jsonb_agg(jsonb_build_object(
    'room_id', r.id,
    'room_name', r.name,
    'member_count', (select count(*) from room_members rm where rm.room_id = r.id and rm.left_at is null),
    'open_tasks', (select count(*) from task_instances ti where ti.room_id = r.id and ti.status = 'open'),
    'completed_tasks', (select count(*) from task_instances ti where ti.room_id = r.id and ti.status = 'completed')
  )) into v_rooms
  from rooms r limit 20;

  return jsonb_build_object(
    'total_overdue_tasks', v_overdue,
    'total_active_tasks', v_total_active,
    'rooms_health', coalesce(v_rooms, '[]'::jsonb)
  );
end;
$$;
revoke execute on function admin_household_health() from public, anon;
grant execute on function admin_household_health() to authenticated;

-- 7. admin_llm_usage
create or replace function admin_llm_usage(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_total_calls int; v_fallback_calls int; v_total_input int; v_total_output int; v_avg_latency numeric;
  v_by_purpose jsonb;
begin
  if not is_ops() then raise exception 'forbidden'; end if;
  select count(*),
         count(*) filter (where fallback_used),
         coalesce(sum(input_tokens), 0),
         coalesce(sum(output_tokens), 0),
         coalesce(round(avg(latency_ms)), 0)
  into v_total_calls, v_fallback_calls, v_total_input, v_total_output, v_avg_latency
  from llm_usage_log
  where created_at >= (now() - (p_days || ' days')::interval);

  select jsonb_object_agg(purpose, cnt) into v_by_purpose
  from (
    select purpose, count(*) as cnt from llm_usage_log
    where created_at >= (now() - (p_days || ' days')::interval) group by purpose
  ) s;

  return jsonb_build_object(
    'total_calls', v_total_calls,
    'fallback_calls', v_fallback_calls,
    'fallback_rate', case when v_total_calls > 0 then round(v_fallback_calls::numeric / v_total_calls, 2) else 0 end,
    'total_input_tokens', v_total_input,
    'total_output_tokens', v_total_output,
    'avg_latency_ms', v_avg_latency,
    'calls_by_purpose', coalesce(v_by_purpose, '{}'::jsonb)
  );
end;
$$;
revoke execute on function admin_llm_usage(int) from public, anon;
grant execute on function admin_llm_usage(int) to authenticated;

-- 8. admin_list_disputes (Ops xem toàn bộ danh tính và nội dung phản ánh)
create or replace function admin_list_disputes(p_limit int default 50) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_res jsonb;
begin
  if not is_ops() then raise exception 'forbidden'; end if;
  select jsonb_agg(jsonb_build_object(
    'dispute_id', d.id,
    'task_id', d.task_id,
    'task_title', ti.title,
    'room_id', d.room_id,
    'room_name', r.name,
    'raised_by', d.raised_by,
    'raised_by_name', pr.display_name,
    'claimed_by', ti.claimed_by,
    'claimed_by_name', pc.display_name,
    'reason_code', d.reason_code,
    'reason', d.reason,
    'status', d.status,
    'created_at', d.created_at
  ) order by d.created_at desc) into v_res
  from disputes d
  join task_instances ti on ti.id = d.task_id
  join rooms r on r.id = d.room_id
  left join profiles pr on pr.id = d.raised_by
  left join profiles pc on pc.id = ti.claimed_by
  limit p_limit;

  return coalesce(v_res, '[]'::jsonb);
end;
$$;
revoke execute on function admin_list_disputes(int) from public, anon;
grant execute on function admin_list_disputes(int) to authenticated;

-- 9. admin_cron_status
create or replace function admin_cron_status() returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_res jsonb;
begin
  if not is_ops() then raise exception 'forbidden'; end if;
  select jsonb_agg(jsonb_build_object(
    'jobid', j.jobid,
    'jobname', j.jobname,
    'schedule', j.schedule,
    'active', j.active,
    'last_run', (
      select jsonb_build_object('status', d.status, 'start_time', d.start_time, 'end_time', d.end_time)
      from cron.job_run_details d where d.jobid = j.jobid order by start_time desc limit 1
    )
  ) order by j.jobname) into v_res
  from cron.job j;

  return coalesce(v_res, '[]'::jsonb);
end;
$$;
revoke execute on function admin_cron_status() from public, anon;
grant execute on function admin_cron_status() to authenticated;

-- 10. Demo Controls
create or replace function admin_demo_force_approve(p_task_id uuid) returns task_instances
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not is_ops() then raise exception 'forbidden'; end if;
  return approve_task(p_task_id);
end;
$$;
revoke execute on function admin_demo_force_approve(uuid) from public, anon;
grant execute on function admin_demo_force_approve(uuid) to authenticated;

create or replace function admin_demo_run_job(p_job text) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_res int;
begin
  if not is_ops() then raise exception 'forbidden'; end if;
  if p_job = 'silent_approval' then
    perform process_silent_approvals();
    return jsonb_build_object('job', p_job, 'status', 'executed');
  elsif p_job = 'escalate' then
    select escalate_tasks() into v_res;
    return jsonb_build_object('job', p_job, 'status', 'executed', 'escalated_count', v_res);
  elsif p_job = 'expire' then
    select expire_tasks() into v_res;
    return jsonb_build_object('job', p_job, 'status', 'executed', 'expired_count', v_res);
  elsif p_job = 'refresh_features' then
    perform refresh_member_features();
    return jsonb_build_object('job', p_job, 'status', 'executed');
  elsif p_job = 'weekly_targets' then
    select generate_weekly_targets() into v_res;
    return jsonb_build_object('job', p_job, 'status', 'executed', 'targets_generated', v_res);
  else
    raise exception 'Job không hợp lệ trong demo controls';
  end if;
end;
$$;
revoke execute on function admin_demo_run_job(text) from public, anon;
grant execute on function admin_demo_run_job(text) to authenticated;
