# DUE BRO — HƯỚNG DẪN BẮT ĐẦU (làm theo từng bước)

> Dành cho cả nhóm 4 người. Làm **đúng thứ tự**. Mỗi bước có cách tự kiểm tra ("✔ Xong khi…").
> Tài liệu chi tiết: `DueBro_MASTER_ARCHITECTURE_v3.md` (**ARCH**; **Mục 15 = playbook build từng giai đoạn cho Agent**) và `DueBro_SKILLS_GUIDE.md` (**SKILLS**).

## Bạn nhận được gì (6 file)

| File | Để làm gì |
|---|---|
| `DueBro_MASTER_ARCHITECTURE_v3.md` | Nguồn sự thật: nghiệp vụ, AI, DB, phân công, lịch |
| `DueBro_SKILLS_GUIDE.md` | Cài skill/rule/workflow cho Claude Code + Antigravity |
| `20260920000000_014_household_hardening.sql` | Vá lỗi bảo mật DB cũ — **chạy đầu tiên** |
| `20260920010000_015_household_core.sql` | Phần Household còn thiếu (tạo việc, leo thang, hết hạn, SOS, Karma…) — chạy sau 014 |
| `security_smoke_test.sql` | Kiểm tra bảo mật trước mỗi lần merge |
| `DueBro_HUONG_DAN_BAT_DAU.md` | File này |

## Quyết định nền: project cũ hay mới?

- **Database (Supabase + 13 migration cũ): GIỮ**, chạy tiếp `014` lên trên. Không sửa file cũ.
- **App mobile cũ: BỎ, làm mới** trong repo mới (chỉ mở ra tham khảo màn hình).
- **Web Admin: làm mới.**

---

## PHẦN A — Cả nhóm làm chung (1 người làm, người khác xem) — khoảng 60–90 phút

### Bước 1. Cài công cụ (mỗi người, 1 lần)
- Node.js LTS, `pnpm` (`npm i -g pnpm`), Git, Docker Desktop (Supabase local cần Docker).
- Supabase CLI (`npm i -g supabase` hoặc theo hướng dẫn chính thức).
- Claude Code và/hoặc Antigravity.
✔ Xong khi: `node -v`, `pnpm -v`, `supabase --version`, `docker ps` đều chạy được.

### Bước 2. Tạo repo mới (1 người — nên là bạn App Core)
```bash
mkdir duebro && cd duebro && git init
mkdir -p docs/contracts docs/decisions supabase/migrations supabase/tests supabase/functions supabase/seed apps packages/shared-types packages/design-tokens notebooks .agents/skills .agents/rules .agents/workflows
```
Copy vào repo:
- 13 migration cũ (`20260915…_001…` đến `…_013…`) → `supabase/migrations/`
- `20260920000000_014_household_hardening.sql` và `20260920010000_015_household_core.sql` → `supabase/migrations/`
- `security_smoke_test.sql` → `supabase/tests/`
- `DueBro_MASTER_ARCHITECTURE_v3.md` → `docs/ARCHITECTURE.md`
- `DueBro_Project_Spec_v2.md` → `docs/SPEC_v2.md`
✔ Xong khi: `supabase/migrations/` có đúng 15 file, tên sắp xếp đúng thứ tự.

### Bước 3. Chạy DB local và kiểm tra bảo mật
```bash
supabase init            # nếu chưa có supabase/config.toml
supabase start
supabase db reset        # áp dụng toàn bộ migration
```
Chạy smoke test (lấy chuỗi kết nối từ `supabase status`):
```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -f supabase/tests/security_smoke_test.sql
```
✔ Xong khi: in ra `SECURITY SMOKE TEST: ALL PASSED`.

⚠️ Bài test và file 014 đã được tôi chạy trên Postgres 16 giả lập Supabase, **chưa chạy trên Supabase thật**. Nếu lỗi:
- **Lỗi `pg_cron`/extension:** bật extension trong `supabase/config.toml` hoặc Dashboard rồi chạy lại.
- **Lỗi về `auth.users` (thiếu cột bắt buộc):** sửa câu `insert into auth.users` ở đầu smoke test cho khớp phiên bản Supabase của bạn.
- **Lỗi `FAIL`:** đó là lỗ hổng thật — **đừng bỏ qua**, báo lại kèm dòng lỗi.

### Bước 4. Áp `014` lên Supabase chung (staging/demo)
```bash
supabase link --project-ref <ref-project-của-bạn>
supabase db push
```
Vào Dashboard → SQL Editor kiểm tra: `select proname from pg_proc where proname in ('create_room','vn_week_start');` phải ra 2 dòng.
✔ Xong khi: staging đã có `014`. **Thông báo cả nhóm**: chữ ký `dispute_task` đã đổi thành `(task_id, reason_code, reason)`.

### Bước 5. Dựng rule + skill (theo SKILLS Mục 2–4)
```bash
npx skills add supabase/agent-skills
npx skills add anthropics/skills --skill frontend-design --skill skill-creator
```
Tạo `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` (nội dung mẫu ở SKILLS Mục 2), 3 skill riêng `duebro-domain`, `duebro-supabase-security`, `duebro-migration` (SKILLS Mục 4) và 3 workflow (SKILLS Mục 5).
Cài thêm theo vai (bảng SKILLS Mục 3): App Core → `expo/skills`; Web Admin → `vercel-labs/agent-skills`; AI → `gemini-api-dev`.
✔ Xong khi: mở agent, hỏi "liệt kê skill bạn đang có" thấy các skill trên.

### Bước 6. Commit và mỗi người kéo về
```bash
git add . && git commit -m "chore: bootstrap monorepo + migrations 001-014 + skills"
git remote add origin <url> && git push -u origin main
```
Mỗi người tạo worktree riêng:
```bash
git worktree add ../duebro-appcore -b feat/appcore/setup
git worktree add ../duebro-ai      -b feat/ai/setup
git worktree add ../duebro-admin   -b feat/admin/setup
git worktree add ../duebro-uiux    -b feat/uiux/setup
```
✔ Xong khi: mỗi người mở agent trong **thư mục worktree của mình**.

---

## PHẦN B — Việc riêng từng người (Ngày 1–2)

Cách làm chung: mở agent trong worktree của mình → **dán prompt khởi động theo vai** (SKILLS Mục 7, điền phần `<việc hôm nay>`) → bắt agent **lập kế hoạch + liệt kê giả định + hỏi** trước khi code → chạy `/pre-merge-check` → tạo PR.

### 🧠 Bạn App Core (mobile)
1. Khởi tạo Expo trong `apps/mobile` (TypeScript, Expo Router), cài NativeWind, supabase-js, TanStack Query, Zod.
2. Dựng **EAS Dev Client** ngay Ngày 1 (push notification cần).
3. Viết contract `docs/contracts/rpc-household.md` (RPC nào, tham số, lỗi) → merge trước code.
4. Ngày 2–3: Auth + Onboarding hồ sơ 4 bước (migration `015` đã có sẵn, chỉ cần áp và test). Sau đó làm theo ARCH Mục 15 (G1 → G4).
5. Sau mỗi migration: `pnpm gen:types` → `packages/shared-types/database.ts`.

### 🤖 Bạn AI
1. Viết contract `docs/contracts/matching.md` và `bro-notifications.md`.
2. Tạo file migration từ SQL trong ARCH 4.4 và 4.5 (đã chạy thử): `supabase migration new lifestyle_matching` (016), `supabase migration new trust_and_llm` (018). Chạy smoke test.
3. Lấy Gemini API key; **kiểm tra trang deprecations của Google** để chọn model, đặt vào biến `GEMINI_MODEL`.
4. Làm `compute-matches` + golden tests (ARCH 7.1) trước, seed 18 hồ sơ (ARCH 6.5) sau.

### 🖥️ Bạn Web Admin
1. Khởi tạo Next.js trong `apps/admin`, cài Tailwind + shadcn/ui + Recharts.
2. Viết contract `docs/contracts/admin-kpi.md` (danh sách `admin_*` RPC, ARCH 4.6 và 10.3).
3. Cấp quyền ops cho 1 tài khoản (câu SQL ở ARCH 4.6), làm middleware kiểm tra role.
4. Migration `019`: `is_ops()`, `admin_kpi_overview()`, `track_event()`. Màn Overview dùng dữ liệu giả trước.

### 🎨 Bạn UI/UX (bạn)
1. Tạo design tokens v0 trong `packages/design-tokens` (ARCH 11.4).
2. Vibe prototype HTML bấm được cho kịch bản demo: Onboarding → Khám phá → Match → Chat → Tạo phòng → Bounty Board (ARCH 1.3 và 11.2).
3. Viết `docs/contracts/ux-screens.md`: danh sách màn + trạng thái loading/rỗng/lỗi.
4. Mascot Bro: 4 trạng thái (vui / cà khịa / SOS / ngủ) + bộ câu template dự phòng phối hợp bạn AI (ARCH 7.3).

---

## PHẦN C — Nhịp làm việc hằng ngày

1. **Đầu ngày (5 phút):** `git pull` `main`, chạy `supabase db reset` nếu có migration mới, chạy `pnpm gen:types`.
2. **Trong ngày:** 1 phiên agent = 1 việc nhỏ, có tiêu chí xong. Agent hỏi luật nào không có trong ARCH → **trả lời rồi ghi vào ARCH Mục 14**, đừng để agent đoán.
3. **Trước khi tạo PR:** `/pre-merge-check`. Nếu đụng DB, dán kết quả smoke test vào PR.
4. **Cuối ngày (10 phút):** cả nhóm báo 3 dòng: làm xong gì / vướng gì / mai làm gì.
5. **Đổi contract hoặc chữ ký RPC:** báo ngay cả nhóm.

## PHẦN D — Khi bị kẹt

| Triệu chứng | Làm gì |
|---|---|
| Agent sửa file người khác | Dừng, revert, nhắc lại "chỉ sửa trong khu vực của tôi" (AGENTS.md) |
| Type lệch sau migration | `pnpm gen:types` rồi commit |
| Smoke test `FAIL` | Đọc nhãn test (vd `S3a`) → tra ARCH 9.1 → sửa đúng quy tắc, không xóa test |
| Gemini trả 404 | Đổi sang `GEMINI_MODEL_FALLBACK`; hệ thống vẫn gửi câu template |
| Push không nhận | Kiểm tra đang dùng Dev Client (không phải Expo Go) và `profiles.push_token` đã lưu |
| Bí luật nghiệp vụ | Hỏi trong nhóm; tạm thời **không code phần đó** |

## Checklist cuối Ngày 1
- [ ] Repo có 15 migration, smoke test `ALL PASSED` (local).
- [ ] Staging đã áp `014`.
- [ ] Cả nhóm đã có skill + `AGENTS.md`, mỗi người 1 worktree.
- [ ] 5 contract đã được tạo (ít nhất khung): `rpc-household`, `matching`, `bro-notifications`, `admin-kpi`, `ux-screens`.
- [ ] Expo Dev Client build được; Gemini key và `GEMINI_MODEL` đã đặt.
