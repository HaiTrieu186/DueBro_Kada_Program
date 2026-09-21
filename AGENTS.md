# Due Bro — luật cho Agent

- **Nguồn sự thật:** `docs/ARCHITECTURE.md` (Mục 5–7, 14 là luật nghiệp vụ & AI). KHÔNG bịa luật nghiệp vụ; thiếu thì DỪNG và HỎI.
- **Stack cố định:** Expo/RN + TS, Supabase (Postgres/RLS/RPC/Edge), Next.js (admin), Google Gemini AI (`@google/genai`). Không đổi công nghệ nếu không được duyệt. Tuyệt đối không dùng Anthropic SDK / Claude API trong code sản phẩm.
- **Mỗi người sở hữu 1 khu vực (ARCH Mục 3.2):** KHÔNG sửa file ngoài khu vực của mình; cần đổi → nêu đề xuất, đừng tự sửa.
- **DB:** không sửa migration cũ (fix-forward). Mọi hàm SECURITY DEFINER phải `set search_path` + revoke public/anon. View phải nhúng kiểm tra quyền (ARCH Mục 9.1).
- **Client:** không bao giờ ghi trực tiếp bảng nghiệp vụ; luôn qua RPC. Không đưa `service_role` vào client.
- **Trước khi báo "xong":** typecheck + lint; nếu đụng DB chạy `supabase/tests/security_smoke_test.sql`.
- **Gặp mâu thuẫn giữa file:** migration đã chạy > ARCHITECTURE > SPEC.

## Bộ Skill Lập Trình & Thiết Kế Tại `.agents/skills/`

### 1. Kỹ năng Nghiệp vụ Nội bộ Due Bro (Bắt buộc tuân thủ)
- `duebro-domain`: Luật chia việc, điểm Effort/Karma, SOS swap, quota tuần, bảo vệ danh tính khi dispute.
- `duebro-supabase-security`: Checklist an toàn R1–R12, SECURITY DEFINER, RLS và smoke test trước khi merge.
- `duebro-migration`: Quy trình migration fix-forward, timestamp chuẩn, pg_cron idempotent.

### 2. Kỹ năng Lập trình Backend, Cơ sở dữ liệu & AI (Coding)
- `supabase`: Tích hợp Supabase Client, Auth, Edge Functions Deno/TS, Realtime, RPC.
- `supabase-postgres-best-practices`: Tối ưu RLS, Indexing, schema Postgres, khóa đồng thời.
- `gemini-api-dev`: Hướng dẫn lập trình SDK `@google/genai`, function calling, structured output cho Gemini 2.5/3.

### 3. Kỹ năng Lập trình Mobile & Web (Coding Frontend)
- `expo-router`: Navigation theo file, stacks, tabs, modals, deep linking.
- `expo-data-fetching`: Quản lý server state với TanStack Query, offline sync, loading/empty/error states.
- `vercel-react-native-skills`: Tối ưu hiệu năng React Native/Expo, list rendering, animations.
- `vercel-react-best-practices`: Tối ưu Next.js App Router, Server Components & Actions cho Web Admin.

### 4. Kỹ năng Thiết kế, Testing & Tiện ích
- `frontend-design`: Hướng dẫn phong cách UI riêng biệt, đậm chất Gen Z, tránh giao diện AI generic.
- `webapp-testing`: Bộ kiểm thử tự động Playwright cho Web Admin (`apps/admin`).
- `web-artifacts-builder`: Dựng nhanh prototype HTML/React cho kịch bản demo 7 phút.
- `pptx`: Tự động tạo và biên tập slide thuyết trình Pitch Deck.
- `theme-factory`: Hệ thống palette màu và font chữ tương thích cao.
- `skill-creator`: Tạo và tinh chỉnh các skill nội bộ của dự án.
