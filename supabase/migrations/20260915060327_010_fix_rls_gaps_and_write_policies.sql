-- Migration 010: Fix RLS gaps + write policies cho chore_templates/bill_templates/swap_requests/profiles
-- Lý do: review lại 001-009 phát hiện ml_predictions, karma_redemptions chưa bật RLS;
-- mv_member_features lộ qua default grant; chore_templates/bill_templates/swap_requests
-- chưa có policy INSERT nên client không ghi được; profiles lộ push_token toàn hệ thống.

-- ============ 1. Bịt lỗ hổng RLS ============

alter table ml_predictions enable row level security;
-- Không tạo policy nào cho 'authenticated' -> deny toàn bộ qua PostgREST,
-- chỉ Edge Function/ML service dùng service_role (bypass RLS) đọc/ghi được.

alter table karma_redemptions enable row level security;
create policy "select_own_karma_redemptions" on karma_redemptions for select
using (member_id = auth.uid());
-- INSERT không mở cho client: redemption phải qua RPC riêng ở Phase sau (câu hỏi mở #4, Mục 15 BRD)

revoke select on mv_member_features from authenticated, anon;
-- Materialized view không hỗ trợ RLS trực tiếp -> phải revoke grant mặc định.
-- Chỉ service_role (ML service gọi qua Edge Function) đọc được, đúng luồng Mục 5.4.

-- ============ 2. profiles: chặn lộ push_token ============

drop policy if exists "users_can_select_profiles" on profiles;
create policy "users_can_select_own_profile" on profiles for select
using (id = auth.uid());

create view profiles_public as
  select id, display_name, avatar_url from profiles;
grant select on profiles_public to authenticated;
-- Client (mobile) đổi mọi chỗ đang query bảng "profiles" của member khác
-- (hiển thị tên/avatar bạn cùng phòng) sang query view "profiles_public" thay vì bảng gốc.

-- ============ 3. chore_templates: RPC thay vì INSERT trực tiếp ============
-- Không mở policy INSERT trên bảng gốc vì cần logic:
--   Host tạo -> approved_by_host = true ngay
--   Member tạo -> approved_by_host = false, chờ Host duyệt (BRD Mục 5)

create or replace function propose_chore_template(
  p_room_id uuid,
  p_name text,
  p_category text,
  p_default_effort_points int,
  p_estimated_minutes int,
  p_recurrence_rule text,
  p_requires_photo boolean
) returns chore_templates
language plpgsql security definer as $$
declare
  v_role member_role;
  v_row chore_templates;
begin
  select role into v_role from room_members
  where room_id = p_room_id and member_id = auth.uid() and left_at is null;

  if v_role is null then
    raise exception 'Bạn không phải thành viên phòng này';
  end if;

  insert into chore_templates (
    room_id, name, category, default_effort_points, estimated_minutes,
    recurrence_rule, requires_photo, created_by, approved_by_host
  ) values (
    p_room_id, p_name, p_category, p_default_effort_points, p_estimated_minutes,
    p_recurrence_rule, p_requires_photo, auth.uid(),
    (v_role = 'host')  -- Host tạo thì auto-approve, Member tạo thì chờ duyệt
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- RPC riêng cho Host duyệt template do Member đề xuất
create or replace function approve_chore_template(p_template_id uuid)
returns chore_templates
language plpgsql security definer as $$
declare
  v_row chore_templates;
  v_room_id uuid;
  v_role member_role;
begin
  select room_id into v_room_id from chore_templates where id = p_template_id;

  select role into v_role from room_members
  where room_id = v_room_id and member_id = auth.uid() and left_at is null;

  if v_role is distinct from 'host' then
    raise exception 'Chỉ Trưởng phòng mới được duyệt';
  end if;

  update chore_templates set approved_by_host = true
  where id = p_template_id
  returning * into v_row;

  return v_row;
end;
$$;

-- ============ 4. bill_templates: cho INSERT trực tiếp qua RLS ============

create policy "room_members_can_insert_bill_templates" on bill_templates for insert
with check (is_room_member(room_id) and created_by = auth.uid());

-- ============ 5. swap_requests: cho INSERT + UPDATE trực tiếp qua RLS ============

create policy "room_members_can_insert_swap_requests" on swap_requests for insert
with check (
  requested_by = auth.uid()
  and exists (select 1 from task_instances ti where ti.id = swap_requests.task_id and is_room_member(ti.room_id))
);

create policy "room_members_can_accept_swap_requests" on swap_requests for update
using (
  exists (select 1 from task_instances ti where ti.id = swap_requests.task_id and is_room_member(ti.room_id))
)
with check (
  exists (select 1 from task_instances ti where ti.id = swap_requests.task_id and is_room_member(ti.room_id))
);
