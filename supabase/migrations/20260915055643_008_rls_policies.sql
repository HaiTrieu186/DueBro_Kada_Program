-- Migration 008: Row Level Security (DueBro Architecture Section 4.8)

create or replace function is_room_member(target_room_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from room_members
    where room_id = target_room_id and member_id = auth.uid() and left_at is null
  );
$$;

-- profiles
alter table profiles enable row level security;
create policy "users_can_select_profiles" on profiles for select
using (true);
create policy "users_can_update_own_profile" on profiles for update
using (id = auth.uid()) with check (id = auth.uid());

-- rooms
alter table rooms enable row level security;
create policy "room_members_can_select_rooms" on rooms for select
using (is_room_member(id));

-- room_members
alter table room_members enable row level security;
create policy "room_members_can_select_room_members" on room_members for select
using (is_room_member(room_id));
create policy "room_members_can_update_own_status" on room_members for update
using (member_id = auth.uid()) with check (member_id = auth.uid());

-- chore_templates
alter table chore_templates enable row level security;
create policy "room_members_can_select_chore_templates" on chore_templates for select
using (is_room_member(room_id));

-- task_instances
alter table task_instances enable row level security;
create policy "room_members_can_select_tasks" on task_instances for select
using (is_room_member(room_id));
create policy "room_members_can_claim_or_submit" on task_instances for update
using (is_room_member(room_id)) with check (is_room_member(room_id));

-- point_ledger: chỉ SELECT cho member phòng mình, KHÔNG có policy INSERT/UPDATE cho 'authenticated'
alter table point_ledger enable row level security;
create policy "select_own_room_ledger" on point_ledger for select
using (is_room_member(room_id));

-- nudge_requests: member được INSERT, KHÔNG được SELECT bảng gốc
alter table nudge_requests enable row level security;
create policy "insert_own_nudge" on nudge_requests for insert
with check (requester_id = auth.uid() and is_room_member(room_id));
create view nudge_counts as
select task_id, room_id, count(*) as nudge_count from nudge_requests group by task_id, room_id;
grant select on nudge_counts to authenticated;

-- disputes: giống nudge_requests — member INSERT được, KHÔNG SELECT bảng gốc, chỉ SELECT qua disputes_public
alter table disputes enable row level security;
create policy "insert_own_dispute" on disputes for insert
with check (raised_by = auth.uid() and is_room_member(room_id));
grant select on disputes_public to authenticated;

-- task_photos
alter table task_photos enable row level security;
create policy "room_members_can_select_task_photos" on task_photos for select
using (exists (select 1 from task_instances ti where ti.id = task_photos.task_id and is_room_member(ti.room_id)));

-- swap_requests
alter table swap_requests enable row level security;
create policy "room_members_can_select_swap_requests" on swap_requests for select
using (exists (select 1 from task_instances ti where ti.id = swap_requests.task_id and is_room_member(ti.room_id)));

-- notifications_log
alter table notifications_log enable row level security;
create policy "room_members_can_select_notifications" on notifications_log for select
using (is_room_member(room_id));

-- weekly_quota_targets
alter table weekly_quota_targets enable row level security;
create policy "room_members_can_select_weekly_quota_targets" on weekly_quota_targets for select
using (is_room_member(room_id));

-- bill_templates
alter table bill_templates enable row level security;
create policy "room_members_can_select_bill_templates" on bill_templates for select
using (is_room_member(room_id));
