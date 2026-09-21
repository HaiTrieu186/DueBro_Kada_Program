---
description: Kiểm tra trước khi tạo PR
---
// turbo
1. Chạy typecheck và lint cho package bị ảnh hưởng.
2. Nếu có thay đổi trong supabase/: chạy `supabase db reset` + security_smoke_test.sql.
3. So sánh thay đổi với khu vực sở hữu (ARCH 3.2): liệt kê file nằm ngoài khu vực của tôi.
4. Soát lại theo skill duebro-domain: có luật nào tôi tự bịa không? Liệt kê.
5. Viết mô tả PR: mục ARCH đang thực hiện, cách kiểm tra, ảnh chụp màn hình nếu có UI.
