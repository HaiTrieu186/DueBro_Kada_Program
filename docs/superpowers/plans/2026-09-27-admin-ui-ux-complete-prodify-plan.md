# Due Bro Web Admin (Prodify & Google Sans) Complete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện toàn diện 100% từng chi tiết nhỏ nhất của Web Admin (`apps/admin`) theo ngôn ngữ thiết kế **Prodify Clean Modern**, typography **Google Sans**, và cơ chế bảo mật Ops RBAC (`role='ops'`), đảm bảo đội ngũ vận hành Due Bro có thể giám sát North Star Metrics, phát hiện nguy cơ rã phòng (Churn Risk), xử lý khiếu nại (Disputes) với bằng chứng ảnh, và theo dõi mô hình AI/ML thời gian thực.

**Architecture:** Next.js 14 App Router với Server Components nạp dữ liệu qua `createAdminClient()` (service_role bypass RLS an toàn phía server) và Client Components cho tương tác động (tactile checkboxes, bộ lọc, modal xem bằng chứng ảnh, drawer phòng). Middleware kiểm soát truy cập nghiêm ngặt bằng JWT claim `app_metadata.role === 'ops'`.

**Tech Stack:** Next.js 14.2, React 18, TypeScript 5.4, Tailwind CSS 3.4, `@supabase/supabase-js`, Lucide React, Google Sans / Google Sans Text font.

**Spec:** `docs/superpowers/specs/2026-09-21-admin-ui-ux-redesign-design.md` & `prodify-admin.html`

## Global Constraints
- Typography bắt buộc: Google Sans & Google Sans Text (`--font-sans`).
- Nền canvas `#F8F8FD`, sidebar `#FBFBFE`, thẻ card `#FFFFFF` với bóng đổ Prodify (`0 8px 30px rgba(110, 90, 220, 0.07)`).
- Không để lộ `service_role` ra Client; client chỉ dùng `createBrowserClient()` hoặc Server Actions.
- Danh tính người khiếu nại (`raised_by`) CHỈ hiển thị trong Admin (Ops role), TUYỆT ĐỐI không lộ ra mobile client (ADR-4 & ARCH Mục 6.6).
- Mọi hàm sửa đổi trạng thái phải qua Server Actions có kiểm tra quyền Ops và validate dữ liệu bằng Zod / TypeScript.

---

### Task 1: Thiết Lập Typography Google Sans & Hệ Thống Token Prodify Nâng Cao

**Files:**
- Modify: `apps/admin/src/app/layout.tsx`
- Modify: `apps/admin/src/app/globals.css`
- Modify: `apps/admin/tailwind.config.ts`

**Interfaces:**
- Consumes: Google Sans Web Fonts CDN (`Google Sans`, `Google Sans Text`).
- Produces: CSS utility tokens (`.prodify-card`, `.btn-ask-ai`, `.btn-pill`, `.badge-in-progress`, `.badge-todo`, `.badge-upcoming`, `.badge-completed`, `.badge-high`, `.badge-low`, `.badge-medium`).

- [x] **Step 1: Cấu hình nhúng font Google Sans đầy đủ các trọng số trong `layout.tsx`**
Ensure `apps/admin/src/app/layout.tsx` includes preconnect and Google Fonts link for weights 400, 500, 600, 700 with Latin and Vietnamese support.

- [x] **Step 2: Khai báo đầy đủ token màu sắc và animations trong `globals.css`**
Add smooth pulse dot animation for system nominal indicators, custom scrollbars, and tactile checkbox styles.

- [x] **Step 3: Cập nhật `tailwind.config.ts` để nhận diện font-family `Google Sans`**
Configure `fontFamily: { sans: ['"Google Sans"', '"Google Sans Text"', 'sans-serif'] }`.

- [x] **Step 4: Kiểm tra build**
Run: `npm run admin:build`
Expected: PASS with 0 errors.

---

### Task 2: Hoàn Thiện Shell Điều Hướng & Sidebar Chuẩn Prodify (`layout.tsx`)

**Files:**
- Modify: `apps/admin/src/app/(dashboard)/layout.tsx`
- Create: `apps/admin/src/components/AdminHeaderBar.tsx`

**Interfaces:**
- Produces: `<AdminHeaderBar />` with breadcrumbs, system status indicator, search shortcut hint (`⌘K`), and Ops Profile pill.
- Updates: `<DashboardLayout />` with responsive mobile drawer support and active route indicators.

- [x] **Step 1: Tạo component `AdminHeaderBar.tsx`**
Create top header bar featuring:
- Dynamic Breadcrumb based on current path (`/`, `/rooms`, `/disputes`, `/ml-monitor`).
- Live system status pill: `● Systems Nominal` with pulsing emerald dot.
- Search teaser input (`⌘K` / `/`).
- User profile chip showing `admin@duebro.vn` and role badge `Ops`.

- [x] **Step 2: Cập nhật Sidebar trong `apps/admin/src/app/(dashboard)/layout.tsx`**
Add:
- Counter badge cho hàng đợi khiếu nại (Dispute Queue badge).
- Live count indicators cho 4 menu chính.
- Ops Shield promotional card with direct CTA.

- [x] **Step 3: Kiểm tra hiển thị và kiểm tra build**
Run: `npm run admin:build`
Expected: PASS.

---

### Task 3: Tối Ưu Hóa & Tương Tác Hóa Trang Dashboard KPI Chính (`/`)

**Files:**
- Modify: `apps/admin/src/app/(dashboard)/page.tsx`
- Modify: `apps/admin/src/components/ProdifyTasksCard.tsx`
- Create: `apps/admin/src/components/CreateRoomModal.tsx`

**Interfaces:**
- Consumes: `getKpiSummary()`, `getRoomHealthSummary()`.
- Produces: Full interactive Prodify Dashboard with quick room creation modal and filterable task rows.

- [x] **Step 1: Nâng cấp `ProdifyTasksCard.tsx` với bộ lọc và tìm kiếm**
Add:
- Filter tabs: `Tất cả`, `Việc khẩn cấp`, `Khiếu nại`, `Định kỳ`.
- Quick action to trigger dispute triage directly from task row.
- Tactile completion checkbox with undo feedback.

- [x] **Step 2: Tạo component `CreateRoomModal.tsx`**
Create a clean Prodify-styled modal allowing Ops to:
- Enter room name (e.g. `Phòng 404 KTX B1`).
- Set max members (2 - 8).
- Automatically generate 6-character unique invite code.
- Submit via server action and immediately refresh dashboard room list.

- [x] **Step 3: Cập nhật thẻ Mục Tiêu North Star và Lịch Trình Tự Động**
Add tooltip explanations for Effort quota rules and pg_cron execution status indicators.

- [x] **Step 4: Kiểm tra build**
Run: `npm run admin:build`
Expected: PASS.

---

### Task 4: Rebuild Giao Diện Giám Sát Phòng & Phát Hiện Nguy Cơ Churn (`/rooms`)

**Files:**
- Modify: `apps/admin/src/app/(dashboard)/rooms/page.tsx`
- Modify: `apps/admin/src/components/RoomListClient.tsx`
- Create: `apps/admin/src/components/RoomDetailDrawer.tsx`

**Interfaces:**
- Consumes: `RoomHealthSummary` from `roomQueries.ts`.
- Produces: Filterable room health grid with side drawer showing member list, chore distribution equity, and churn risk diagnosis.

- [x] **Step 1: Rebuild `rooms/page.tsx` sang Prodify Clean Modern aesthetic**
Replace dark table styles with Prodify cards, metrics progress bars, and pastel churn badges (`Khỏe mạnh`, `Cần chú ý`, `Nguy cơ cao`).

- [x] **Step 2: Tạo component `RoomDetailDrawer.tsx`**
Slide-over drawer displaying:
- Room details: Invite code (with 1-click clipboard copy), Host name, Created date.
- Member list: Trust score, achieved Effort points vs weekly target, status (`active` / `away`).
- Task completion history chart (Last 7 days).
- Churn diagnosis warnings (e.g. "Chênh lệch điểm giữa các thành viên vượt quá 40%").

- [x] **Step 3: Cập nhật `RoomListClient.tsx` với tìm kiếm và phân loại**
Implement client-side search by room name or invite code, and segmented tabs (`Tất cả`, `Khỏe mạnh`, `Nguy cơ Churn`, `Phòng Pro`).

- [x] **Step 4: Kiểm tra build**
Run: `npm run admin:build`
Expected: PASS.

---

### Task 5: Rebuild Hàng Đợi Phân Xử Khiếu Nại Ẩn Danh & Xem Bằng Chứng Ảnh (`/disputes`)

**Files:**
- Modify: `apps/admin/src/app/(dashboard)/disputes/page.tsx`
- Modify: `apps/admin/src/components/DisputeQueueClient.tsx`
- Create: `apps/admin/src/components/EvidenceModal.tsx`
- Modify: `apps/admin/src/app/actions/disputeActions.ts`

**Interfaces:**
- Consumes: `getDisputesList()` from `disputeQueries.ts`.
- Produces: Unmasked Ops dispute review interface with photo zoom, reason classification, and one-click resolution server actions.

- [x] **Step 1: Rebuild `disputes/page.tsx` theo chuẩn Prodify**
Add:
- Summary KPI cards: `Đang mở`, `Đã giải quyết`, `Đã bác bỏ`, `Thời gian giải quyết trung bình`.
- Alert banner explaining Anonymity Shield architecture.

- [x] **Step 2: Tạo component `EvidenceModal.tsx`**
Lightbox modal to inspect attached chore completion photos:
- Zoom in / out controls.
- Chore title, submission timestamp, and assignee info.

- [x] **Step 3: Hoàn thiện `disputeActions.ts` với 3 kịch bản xử lý**
1. `reopen_task`: Chấp thuận khiếu nại → Reset trạng thái task về `open`, xóa ảnh không đạt, trừ điểm hoặc gửi thông báo.
2. `dismiss_dispute`: Bác bỏ khiếu nại → Giữ nguyên trạng thái `completed`.
3. `penalize_karma`: Phạt -15 Karma người bị tố cáo nếu phát hiện gian lận bằng chứng.

- [x] **Step 4: Kiểm tra build**
Run: `npm run admin:build`
Expected: PASS.

---

### Task 6: Rebuild Bảng Điều Khiển Mô Hình AI / ML & Cold Start (`/ml-monitor`)

**Files:**
- Modify: `apps/admin/src/app/(dashboard)/ml-monitor/page.tsx`
- Modify: `apps/admin/src/lib/mlQueries.ts`

**Interfaces:**
- Consumes: `getMlMonitoringSummary()` from `mlQueries.ts`.
- Produces: Prodify visual cards tracking Cold Start seed data progression, Gemini API usage costs, and candidate ranking predictions.

- [x] **Step 1: Rebuild `ml-monitor/page.tsx` sang Prodify Light**
Transform:
- Cold Start Progress card: 18 seed profiles status bar, model version badge `v1.2-rule-based-effort-fit`.
- Gemini LLM Quota & Cost card: Total prompt tokens, cache hit rate, estimated cost.
- Candidate Ranking predictions table with feature breakdown tags (`completion_rate`, `avg_delay_hours`, `quota_progress_pct`).

- [x] **Step 2: Thêm bộ lọc model version và search task trong table predictions**
Allow Ops to filter predictions by room or task ID.

- [x] **Step 3: Kiểm tra build**
Run: `npm run admin:build`
Expected: PASS.

---

### Task 7: Đồng Bộ Hóa Toàn Diện & Kiểm Thử Tự Động (Verification)

**Files:**
- Test: `apps/admin/tests/` (hoặc automated smoke script)
- Verify: `npm run admin:build`
- Verify: Dev server `http://localhost:3000`

- [x] **Step 1: Chạy typecheck và build toàn bộ monorepo**
Run: `npm run admin:build`
Expected: 100% PASS with 0 warnings/errors.

- [x] **Step 2: Kiểm tra bảo mật RLS và Middleware**
Verify:
1. Truy cập `/` khi chưa đăng nhập → Tự động chuyển hướng về `/login`.
2. Đăng nhập bằng `admin@duebro.vn` / `DueBro@2026Ops` → Chuyển hướng vào `/` với giao diện Prodify & Google Sans.
3. Tài khoản không có `role='ops'` → Tự động chuyển hướng về `/unauthorized`.

- [x] **Step 3: Commit toàn bộ mã nguồn**
```bash
git add apps/admin/ docs/superpowers/
git commit -m "feat(admin): complete full prodify overhaul with google sans typography"
```
