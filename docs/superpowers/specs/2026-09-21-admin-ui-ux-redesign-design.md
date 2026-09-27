# Design Spec: Due Bro Admin Ops UI/UX Overhaul (Anti "AI Slop")

- **Date:** 2026-09-21
- **Target:** `apps/admin` (Web Admin Dashboard)
- **Design Archetype:** Linear / Raycast / Stripe Ops — Sleek Engineered Dark Mode
- **Typography:** Google Fonts (`Plus Jakarta Sans` for UI + `JetBrains Mono` for tabular data/code)

---

## 1. Problem Statement & Anti "AI Slop" Goals

### The Symptoms of "AI Slop" in the Current Admin
1. **Generic Flat Mud Grays:** Every card uses `#242424` on `#181818` with harsh `border-white/10` lines, lacking elevation, ambient light, or depth.
2. **Icon & Badge Over-Saturation:** Arbitrary Lucide icons plastered beside every label; oversized bulky colored badges (`bg-red-500/10` pills) screaming for attention and causing visual fatigue.
3. **Poor Data Density & Lack of Hierarchy:** Giant card paddings for 1 line of text; table columns feel unstructured and misaligned without tabular number styling; lack of sorting, copy-to-clipboard, or quick preview interactions.
4. **Generic System Fonts:** Fallback system sans-serif lacks brand personality, polish, and Vietnamese accent balance.

### Redesign Goals
- **Bespoke Craftsmanship:** Rich obsidian surface layering (`#0c0c0e` canvas, `#131316` surface, `#1a1a1f` interactive) with hairline borders (`border-white/[0.08]`) and top-edge luminous accents.
- **Precision Typography:** Google Font **Plus Jakarta Sans** (`--font-sans`) for headings, body, and labels, paired with **JetBrains Mono** (`--font-mono`) with `tabular-nums` for metrics, dates, percentages, and invite codes.
- **Minimalist Status Dot Language:** Replace noisy pill badges with refined status indicators: precision pulsing glowing micro-dots + subtle text chips.
- **High Utility UX:** 1-click clipboard copy with toast feedback, quick drawer inspection, keyboard shortcuts (`/` for search focus), segmented filter controls with live count pills, and multi-column sorting.

---

## 2. Design System Tokens & Foundations

### 2.1 Color Palette
- **Canvas (Background):** `#0c0c0e`
- **Surface Level 1 (Sidebar, Cards, Table Container):** `#131316` (Border: `border-white/[0.07]`)
- **Surface Level 2 (Inputs, Sub-cards, Table Header):** `#18181d` (Border: `border-white/[0.09]`)
- **Surface Level 3 (Hover, Active states, Dropdown menus):** `#202027`
- **Brand Accent:** Electric Purple `#7C3AED` (Primary) & `#9061F9` (Glow/Accent), used with intention as micro-accents and subtle gradient underlines.
- **Semantic Accents:**
  - Emerald (Healthy / Nominal): `#10B981` (Glow: `rgba(16,185,129,0.15)`)
  - Amber (Warning / Review Needed): `#F59E0B`
  - Rose (High Churn / Urgent): `#F43F5E`
  - Cyan (ML / Tech): `#06B6D4`

### 2.2 Typography
Loaded via `next/font/google` in `apps/admin/src/app/layout.tsx`:
- **UI Sans:** `Plus_Jakarta_Sans({ subsets: ['latin', 'vietnamese'], variable: '--font-sans' })`
- **Tabular Mono:** `JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })`

---

## 3. Detailed Component & Page Specifications

### 3.1 Root Layout & Sidebar (`apps/admin/src/app/(dashboard)/layout.tsx`)
- **Brand Identity:**
  - Due Bro mascot emblem with subtle purple glow ring.
  - Live system status pill: `● Systems Nominal` with pulsing emerald dot.
- **Navigation Menu:**
  - Segmented active state: Sleek pill background (`bg-white/[0.08]`) with subtle left vertical highlight indicator (`bg-[#7C3AED]`), eliminating the outdated solid purple block.
  - Subtle shortcut hints and badge counters (e.g. pending disputes badge).
- **Header Toolbar (Top Navigation):**
  - Breadcrumb trail indicating current section.
  - Search trigger teaser (`⌘K` / `/`).
  - Ops Role badge with security level indicator.
- **User Profile Footer:**
  - Ops user avatar, email label, and refined Sign Out action with hover confirmation.

### 3.2 Room Health & Churn Monitoring (`apps/admin/src/components/RoomListClient.tsx`)
- **Segmented Control Filter Bar:**
  - Modern horizontal tab strip (All, High Churn Risk, Review Needed, Healthy, Pro Tier).
  - Each tab includes a numerical count pill showing the exact count of matching rooms.
- **Interactive Control Bar:**
  - Search input with clear button (`X`), search icon, and shortcut indicator (`/`).
  - Sort selector: Sort by Highest Churn Risk, Most Recently Active, Lowest Completion Rate, Name (A-Z).
- **High-Density Data Table:**
  - **Phòng & Gói:** Room name with Pro gradient badge or Free subtle tag; invite code with 1-click copy button and copied tooltip.
  - **Churn Risk Indicator:** Replaced with a sleek Status Chip: micro-dot (green/yellow/red) + risk label + collapsible risk reasons.
  - **Thành viên:** Clean avatar stack / occupancy bar with active vs max ratio in `font-mono`.
  - **Tiến độ Task:** Compact progress bar with smooth dual-tone gradient and completed vs delayed split.
  - **Hoạt động:** Humanized relative time ("2 giờ trước", "Hôm qua") with exact timestamp on hover.
- **Quick-View Room Detail Drawer:**
  - Clicking any row slides out a sleek side drawer showing full room telemetry: active members list, chore completion velocity, dispute history, and last action logs.

### 3.3 Operations KPI Dashboard (`apps/admin/src/app/(dashboard)/page.tsx` & `KpiCard.tsx`)
- **KPI Card Redesign:**
  - Top hairline accent gradient.
  - Large tabular number display in `font-mono tracking-tight`.
  - Trend indicator pill showing health status and weekly velocity.
  - Contextual helper text with secondary metrics.
- **Urgent Action Banner:**
  - Sleek alert banner with glowing amber border for pending disputes.

### 3.4 Dispute Resolution Queue (`apps/admin/src/components/DisputeQueueClient.tsx`)
- **Split-Inspection Layout:**
  - Task and dispute summary card with clean distinction between Reporter and Assignee.
  - Photo evidence preview with zoom lightbox.
  - Quick action buttons with confirm dialogs and loading state spinners.

### 3.5 ML Monitoring (`apps/admin/src/app/(dashboard)/ml-monitor/page.tsx`)
- **Telemetry Console Look:**
  - Milestone progress card with dual-color cold start progress bar.
  - Metric gauges and model execution audit table in `font-mono`.

### 3.6 Login Page (`apps/admin/src/app/login/page.tsx`)
- **Ambient Lighting:**
  - Subtle radial purple ambient glow behind a central frosted glass card.
  - Clean floating inputs with focus ring `#7C3AED`.

---

## 4. Verification & Testing Plan
1. **Visual & Layout Verification:**
   - Verify all pages compile and render cleanly with Next.js App Router.
   - Verify Google Fonts (`Plus Jakarta Sans` and `JetBrains Mono`) load properly without layout shift or FOIT.
2. **Interactive Testing:**
   - Filter tabs in `RoomListClient`: Verify filtering across All, High, Medium, Healthy, Pro.
   - Search & Sort in `RoomListClient`: Test query filtering and sorting mechanisms.
   - Copy invite code to clipboard: Verify copy action and visual feedback.
   - Responsive behavior: Test on Desktop (1440px), Laptop (1024px), and Tablet.
