-- security_smoke_test.sql — chạy TRƯỚC MỖI LẦN MERGE có đụng DB.
-- Cách chạy (local): supabase db reset && psql "$(supabase status -o env | grep DB_URL | cut -d= -f2 | tr -d '"')" -v ON_ERROR_STOP=1 -f supabase/tests/security_smoke_test.sql
-- Toàn bộ chạy trong 1 transaction rồi ROLLBACK → không để lại dữ liệu, chạy lại bao nhiêu lần cũng được.
-- Thành công = in "SECURITY SMOKE TEST: ALL PASSED". Có lỗi = dừng ngay và nêu test nào hỏng.
-- Bài test dựa trên lỗ hổng THẬT đã tái hiện (Architecture v3, Mục 4.2). Thêm test mới mỗi khi thêm bảng/RPC/view.
begin;

create or replace function _t(p_role text, p_uid uuid, p_sql text, p_expect text, p_label text)
returns void language plpgsql as $$
declare v_ok boolean := true; v_err text; v_cnt bigint;
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_uid::text, ''), true);
  execute format('set local role %I', p_role);
  begin
    execute p_sql;
  exception when others then
    v_ok := false; v_err := sqlerrm;
  end;
  reset role;
  if p_expect = 'fail' and v_ok then
    raise exception 'SECURITY FAIL [%]: câu lệnh lẽ ra phải bị chặn nhưng đã chạy được', p_label;
  elsif p_expect = 'ok' and not v_ok then
    raise exception 'FUNCTIONAL FAIL [%]: lẽ ra phải chạy được nhưng lỗi: %', p_label, v_err;
  end if;
end $$;

-- ---------- dữ liệu giả ----------
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@t.vn'), ('aaaaaaaa-0000-0000-0000-000000000002', 'b@t.vn'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'out@t.vn');   -- trigger handle_new_user tự tạo profiles
insert into rooms (id, name, invite_code, created_by) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'R1', 'ZZZ111', 'aaaaaaaa-0000-0000-0000-000000000001');
insert into room_members (room_id, member_id, role) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'host'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'member');
insert into task_instances (id, room_id, source, title, effort_points, due_at) values
  ('cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'adhoc', 'Rửa bát', 20, now() + interval '1 day');

-- ---------- S1: anon không gọi được RPC ----------
select _t('anon', null, $q$ select claim_task('cccccccc-0000-0000-0000-000000000001') $q$, 'fail', 'S1 anon claim_task');
select _t('anon', null, $q$ select count(*) from profiles $q$, 'fail', 'S1b anon đọc profiles');
-- ---------- S2: người ngoài phòng ----------
select _t('authenticated', 'aaaaaaaa-0000-0000-0000-000000000003', $q$ select claim_task('cccccccc-0000-0000-0000-000000000001') $q$, 'fail', 'S2 outsider claim_task');
select _t('authenticated', 'aaaaaaaa-0000-0000-0000-000000000003', $q$ select request_nudge('cccccccc-0000-0000-0000-000000000001') $q$, 'fail', 'S2b outsider request_nudge');
-- ---------- S3: không ghi trực tiếp vào bảng nghiệp vụ ----------
select _t('authenticated', 'aaaaaaaa-0000-0000-0000-000000000002', $q$ update room_members set role='host' where member_id='aaaaaaaa-0000-0000-0000-000000000002' $q$, 'fail', 'S3a tự nâng host');
select _t('authenticated', 'aaaaaaaa-0000-0000-0000-000000000002', $q$ update room_members set karma_score=9999 where member_id='aaaaaaaa-0000-0000-0000-000000000002' $q$, 'fail', 'S3b tự sửa karma');
select _t('authenticated', 'aaaaaaaa-0000-0000-0000-000000000002', $q$ update task_instances set effort_points=9999 $q$, 'fail', 'S3c sửa effort_points');
select _t('authenticated', 'aaaaaaaa-0000-0000-0000-000000000002', $q$ insert into point_ledger(room_id,member_id,point_type,reason,amount) values ('bbbbbbbb-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000002','effort_weekly','task_base',999) $q$, 'fail', 'S3d tự ghi điểm');
select _t('authenticated', 'aaaaaaaa-0000-0000-0000-000000000002', $q$ insert into disputes(task_id,room_id,raised_by) values ('cccccccc-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000002') $q$, 'fail', 'S3e insert disputes trực tiếp');
select _t('authenticated', 'aaaaaaaa-0000-0000-0000-000000000002', $q$ insert into nudge_requests(room_id,task_id,requester_id) values ('bbbbbbbb-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000002') $q$, 'fail', 'S3f insert nudge trực tiếp');
select _t('authenticated', 'aaaaaaaa-0000-0000-0000-000000000002', $q$ insert into swap_requests(task_id,requested_by) values ('cccccccc-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000002') $q$, 'fail', 'S3g insert swap trực tiếp');
-- ---------- S4: RPC chỉ dành cho hệ thống ----------
select _t('authenticated', 'aaaaaaaa-0000-0000-0000-000000000001', $q$ select approve_task('cccccccc-0000-0000-0000-000000000001') $q$, 'fail', 'S4a approve_task');
select _t('authenticated', 'aaaaaaaa-0000-0000-0000-000000000001', $q$ select process_silent_approvals() $q$, 'fail', 'S4b process_silent_approvals');
select _t('authenticated', 'aaaaaaaa-0000-0000-0000-000000000001', $q$ select * from mv_member_features $q$, 'fail', 'S4c đọc mv_member_features');
do $$
begin
  if to_regprocedure('escalate_tasks()') is not null then
    perform _t('authenticated','aaaaaaaa-0000-0000-0000-000000000001', $q$ select escalate_tasks() $q$, 'fail', 'S4d escalate_tasks');
    perform _t('authenticated','aaaaaaaa-0000-0000-0000-000000000001', $q$ select expire_tasks() $q$, 'fail', 'S4e expire_tasks');
    perform _t('authenticated','aaaaaaaa-0000-0000-0000-000000000001', $q$ select * from claim_pending_notifications(1) $q$, 'fail', 'S4f claim_pending_notifications');
    perform _t('authenticated','aaaaaaaa-0000-0000-0000-000000000001', $q$ select assign_task('cccccccc-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','x') $q$, 'fail', 'S4g assign_task');
    perform _t('authenticated','aaaaaaaa-0000-0000-0000-000000000001', $q$ select generate_weekly_targets() $q$, 'fail', 'S4h generate_weekly_targets');
    perform _t('authenticated','aaaaaaaa-0000-0000-0000-000000000001', $q$ select count(*) from notifications_log where recipient_id <> 'aaaaaaaa-0000-0000-0000-000000000001' and false $q$, 'ok', 'S4i notifications_log truy vấn được');
  end if;
end $$;
-- ---------- S5: RPC hợp lệ vẫn chạy được (chống "siết quá tay") ----------
select _t('authenticated', 'aaaaaaaa-0000-0000-0000-000000000002', $q$ select claim_task('cccccccc-0000-0000-0000-000000000001') $q$, 'ok', 'S5a member claim');
select _t('authenticated', 'aaaaaaaa-0000-0000-0000-000000000001', $q$ select request_nudge('cccccccc-0000-0000-0000-000000000001') $q$, 'ok', 'S5b nudge');
select _t('authenticated', 'aaaaaaaa-0000-0000-0000-000000000001', $q$ select * from create_room('Phòng test') $q$, 'ok', 'S5c create_room');
-- ---------- S6: Anonymity Shield — client không đọc được danh tính ----------
update task_instances set status='pending_approval', submitted_at=now() where id='cccccccc-0000-0000-0000-000000000001';
select _t('authenticated', 'aaaaaaaa-0000-0000-0000-000000000001', $q$ select dispute_task('cccccccc-0000-0000-0000-000000000001','not_clean','x') $q$, 'ok', 'S6a dispute hợp lệ');
do $$
declare n bigint;
begin
  perform set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', true);
  set local role authenticated;
  select count(*) into n from disputes;       if n <> 0 then raise exception 'SECURITY FAIL [S6b]: client đọc được bảng disputes gốc'; end if;
  select count(*) into n from nudge_requests; if n <> 0 then raise exception 'SECURITY FAIL [S6c]: client đọc được nudge_requests gốc'; end if;
  select count(*) into n from task_events;    if n <> 0 then raise exception 'SECURITY FAIL [S6d]: client đọc được task_events'; end if;
  select count(*) into n from disputes_public; if n <> 1 then raise exception 'FUNCTIONAL FAIL [S6e]: disputes_public phải thấy 1 dispute của phòng mình (thấy %)', n; end if;
  if exists (select 1 from information_schema.columns where table_name='disputes_public' and column_name in ('raised_by','reason'))
    then raise exception 'SECURITY FAIL [S6f]: disputes_public lộ raised_by/reason'; end if;
  reset role;
  -- người ngoài phòng: view không được lộ dữ liệu xuyên phòng (bug migration 011)
  perform set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000003', true);
  set local role authenticated;
  select count(*) into n from disputes_public; if n <> 0 then raise exception 'SECURITY FAIL [S6g]: disputes_public lộ dữ liệu xuyên phòng'; end if;
  select count(*) into n from nudge_counts;    if n <> 0 then raise exception 'SECURITY FAIL [S6h]: nudge_counts lộ dữ liệu xuyên phòng'; end if;
  select count(*) into n from weekly_quota_progress; if n <> 0 then raise exception 'SECURITY FAIL [S6i]: weekly_quota_progress lộ xuyên phòng'; end if;
  reset role;
end $$;
-- ---------- S7: profiles không lộ push_token ----------
do $$
declare n bigint;
begin
  perform set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', true);
  set local role authenticated;
  select count(*) into n from profiles where id <> 'aaaaaaaa-0000-0000-0000-000000000001';
  if n <> 0 then raise exception 'SECURITY FAIL [S7]: đọc được profiles của người khác (lộ push_token). Dùng profiles_public'; end if;
  reset role;
end $$;
-- ---------- S8: Matching/Chat (chỉ chạy nếu đã có migration 016/017) ----------
do $$
begin
  if to_regclass('public.lifestyle_profiles') is not null then
    insert into lifestyle_profiles(user_id,city,occupation_type,wake_up_time,sleep_time,budget_min,budget_max,tidiness_level,noise_tolerance)
    values ('aaaaaaaa-0000-0000-0000-000000000001','HCM','student','07:00','23:00',1000000,3000000,3,3);
    perform _t('authenticated','aaaaaaaa-0000-0000-0000-000000000001', $q$ update lifestyle_profiles set is_seed_data=true where user_id='aaaaaaaa-0000-0000-0000-000000000001' $q$, 'fail', 'S8a tự set is_seed_data');
    perform _t('anon', null, $q$ select count(*) from lifestyle_profiles $q$, 'fail', 'S8b anon đọc lifestyle_profiles');
    perform _t('authenticated','aaaaaaaa-0000-0000-0000-000000000001', $q$ insert into match_suggestions(user_id,candidate_id,compatibility_score,breakdown,reasons,model_version) values ('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000002',1,'{}','{}','x') $q$, 'fail', 'S8c client ghi match_suggestions');
  end if;
  if to_regclass('public.messages') is not null then
    perform _t('anon', null, $q$ select count(*) from messages $q$, 'fail', 'S9a anon đọc messages');
    perform _t('authenticated', 'aaaaaaaa-0000-0000-0000-000000000003', $q$ select count(*) from messages $q$, 'ok', 'S9b authenticated đọc messages');
  end if;
  if to_regprocedure('admin_kpi_overview()') is not null then
    -- User thường (không có claim ops) gọi admin_kpi_overview phải bị chặn bởi is_ops()
    perform _t('authenticated', 'aaaaaaaa-0000-0000-0000-000000000001', $q$ select admin_kpi_overview() $q$, 'fail', 'S10a user thường gọi admin_kpi_overview');
    perform _t('anon', null, $q$ select admin_kpi_overview() $q$, 'fail', 'S10b anon gọi admin_kpi_overview');
  end if;
end $$;

rollback;
\echo 'SECURITY SMOKE TEST: ALL PASSED'

