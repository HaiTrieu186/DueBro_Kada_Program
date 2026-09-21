---
description: Tạo migration mới đúng quy trình Due Bro
---
1. Hỏi tôi: migration này thuộc module nào và làm gì (1 câu).
2. Đọc skill duebro-migration và duebro-supabase-security.
// turbo
3. Chạy `supabase migration new <tên>`.
4. Viết SQL theo checklist bảo mật; thêm test tương ứng vào supabase/tests/security_smoke_test.sql.
// turbo
5. Chạy `supabase db reset` rồi chạy security_smoke_test.sql; báo kết quả.
// turbo
6. Chạy `pnpm gen:types` và tóm tắt thay đổi contract (nếu có).
