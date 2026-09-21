---
name: duebro-migration
description: Quy trình tạo migration Postgres/Supabase cho Due Bro. Dùng khi thêm/sửa schema, RPC, policy, cron.
---
# Quy trình Migration cho Due Bro

1. Tạo file: `supabase migration new <tên_mô_tả>` (KHÔNG tự đặt số). Không sửa migration đã chạy; sai thì viết migration mới (fix-forward).
2. Chỉ sửa đối tượng thuộc khu vực của mình (ARCH 3.2). Đối tượng của người khác → đề xuất bằng issue/contract.
3. `alter type ... add value` phải ở file riêng, không dùng ngay trong cùng file.
4. Cron: dùng mẫu unschedule → schedule (idempotent); giờ theo UTC (bảng ARCH 8.3).
5. Kiểm tra: `supabase db reset` sạch → chạy `security_smoke_test.sql` → `pnpm gen:types` → commit `database.types.ts`.
6. Đổi chữ ký RPC = thay đổi contract: cập nhật `docs/contracts/*.md` + `CHANGELOG` và báo nhóm.
