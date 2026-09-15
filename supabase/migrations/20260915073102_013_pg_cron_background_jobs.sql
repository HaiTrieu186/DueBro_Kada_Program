-- Migration 013: pg_cron background jobs & database-level automation
-- 1. Silent approval sau 6 tiếng (Architecture Mục 6.5)
-- 2. Tự động refresh Feature Store mv_member_features mỗi giờ (Architecture Mục 4.9, 8)
-- 3. Tự động reset away_status = 'active' khi hết hạn away_to (Architecture Mục 6.8)

-- Bật extension pg_cron nếu chưa có
create extension if not exists pg_cron with schema extensions;

-- ============ 1. process_silent_approvals (Mục 6.5) ============
-- Quét các task pending_approval quá 6 tiếng không bị dispute và tự động gọi approve_task
create or replace function process_silent_approvals()
returns int
language plpgsql security definer as $$
declare
  v_rec record;
  v_count int := 0;
begin
  for v_rec in
    select id
    from task_instances
    where status = 'pending_approval'
      and submitted_at <= now() - interval '6 hours'
    order by submitted_at asc
  loop
    begin
      perform approve_task(v_rec.id);
      v_count := v_count + 1;
    exception when others then
      -- Ghi log cảnh báo nếu 1 task gặp lỗi, không làm gián đoạn các task khác trong batch
      raise warning 'Lỗi silent approve cho task %: %', v_rec.id, sqlerrm;
    end;
  end loop;

  return v_count;
end;
$$;

-- ============ 2. reset_expired_away_status (Mục 6.8) ============
-- Khi qua ngày away_to, tự động đưa member về away_status = 'active'
create or replace function reset_expired_away_status()
returns int
language plpgsql security definer as $$
declare
  v_updated int;
begin
  update room_members
  set away_status = 'active',
      away_from = null,
      away_to = null
  where away_status = 'away'
    and away_to < current_date;

  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$;

-- ============ 3. refresh_member_features (Mục 4.9, 8) ============
-- Làm mới Materialized View tính toán feature ML định kỳ
create or replace function refresh_member_features()
returns void
language plpgsql security definer as $$
begin
  refresh materialized view concurrently mv_member_features;
end;
$$;

-- ============ Quyền thực thi ============
-- Thu hồi quyền public/client, chỉ cho phép postgres và service_role gọi
revoke execute on function process_silent_approvals() from public, authenticated, anon;
revoke execute on function reset_expired_away_status() from public, authenticated, anon;
revoke execute on function refresh_member_features() from public, authenticated, anon;

grant execute on function process_silent_approvals() to postgres, service_role;
grant execute on function reset_expired_away_status() to postgres, service_role;
grant execute on function refresh_member_features() to postgres, service_role;

-- ============ Đăng ký lịch trình pg_cron ============
do $$
begin
  -- Hủy lịch cũ nếu đã tồn tại để đảm bảo tính idempotent
  if exists (select 1 from cron.job where jobname = 'job_silent_approval_every_30m') then
    perform cron.unschedule('job_silent_approval_every_30m');
  end if;
  if exists (select 1 from cron.job where jobname = 'job_refresh_mv_features_hourly') then
    perform cron.unschedule('job_refresh_mv_features_hourly');
  end if;
  if exists (select 1 from cron.job where jobname = 'job_reset_expired_away_daily') then
    perform cron.unschedule('job_reset_expired_away_daily');
  end if;
end $$;

-- 1. Silent approval: Quét mỗi 30 phút (Mục 6.5)
select cron.schedule(
  'job_silent_approval_every_30m',
  '*/30 * * * *',
  'select process_silent_approvals();'
);

-- 2. Refresh Feature Store: Quét mỗi giờ (Mục 4.9, 8)
select cron.schedule(
  'job_refresh_mv_features_hourly',
  '0 * * * *',
  'select refresh_member_features();'
);

-- 3. Reset Away Mode: Chạy hàng ngày lúc 00:01 (Mục 6.8)
select cron.schedule(
  'job_reset_expired_away_daily',
  '1 0 * * *',
  'select reset_expired_away_status();'
);
