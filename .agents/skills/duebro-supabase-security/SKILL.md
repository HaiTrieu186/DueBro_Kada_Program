---
name: duebro-supabase-security
description: Checklist bảo mật Supabase cho Due Bro. Dùng bất cứ khi nào tạo/sửa bảng, view, policy, RPC, Edge Function, Storage, Realtime hoặc migration.
---
# Checklist (ARCH Mục 9.1) — tự kiểm tra từng mục trước khi báo xong

- [ ] Bảng mới: bật RLS; policy `to authenticated`; client KHÔNG có insert/update/delete trực tiếp nếu là bảng nghiệp vụ (`revoke`), ghi qua RPC.
- [ ] Hàm `security definer`: `set search_path = public, pg_temp`; có `auth.uid()` check; `revoke execute ... from public, anon`; `grant execute ... to authenticated` chỉ khi client cần.
- [ ] View: nhúng `is_room_member()` / `is_connection_member()` / `is_ops()` hoặc `with (security_invoker = true)` (xem R3). Materialized view: revoke khỏi anon/authenticated.
- [ ] Không thêm bảng vào `supabase_realtime` ngoài `messages`, `task_instances`.
- [ ] Không đưa `service_role` vào client; Edge Function kiểm tra JWT hoặc `x-cron-secret`.
- [ ] Chạy: `supabase db reset && psql ... -f supabase/tests/security_smoke_test.sql` → phải "ALL PASSED". Thêm test cho đối tượng mới.
- [ ] Dán kết quả smoke test vào mô tả PR.
