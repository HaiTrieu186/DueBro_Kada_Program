-- Migration 011: Fix room-isolation bug ở disputes_public/nudge_counts
-- Nguyên nhân: view được tạo bởi role có BYPASSRLS nên mặc định bỏ qua RLS của bảng gốc,
-- khiến user ngoài phòng vẫn đọc được dispute/nudge của phòng khác qua view.
-- Cách sửa tối ưu: KHÔNG mở SELECT trên bảng gốc cho bất kỳ ai (giữ nguyên đóng hoàn toàn,
-- đúng thiết kế Anonymity Shield ban đầu), thay vào đó nhúng thẳng điều kiện
-- is_room_member(room_id) vào bên trong định nghĩa view. Một nguồn sự thật duy nhất
-- cho quyền truy cập, không phụ thuộc dev nhớ "chỉ query qua view".

drop view if exists disputes_public;
create view disputes_public as
  select id, task_id, room_id, status, created_at, resolved_at
  from disputes
  where is_room_member(room_id);
grant select on disputes_public to authenticated;

drop view if exists nudge_counts;
create view nudge_counts as
  select task_id, room_id, count(*) as nudge_count
  from nudge_requests
  where is_room_member(room_id)
  group by task_id, room_id;
grant select on nudge_counts to authenticated;

-- profiles_public và weekly_quota_progress không có dữ liệu nhạy cảm theo hàng (row-level)
-- như disputes/nudge -- profiles_public đã lọc CỘT (bỏ push_token), không cần lọc theo phòng
-- vì display_name/avatar_url không phải bí mật giữa các phòng. weekly_quota_progress đã đi
-- qua bảng point_ledger có RLS is_room_member() sẵn -- nhưng view này CŨNG bị bug tương tự
-- (owner bypass RLS), nên phải fix luôn:

create or replace view weekly_quota_progress as
  select room_id, member_id, week_start, sum(amount) as achieved_points
  from point_ledger
  where point_type = 'effort_weekly' and is_room_member(room_id)
  group by room_id, member_id, week_start;
