# DUE BRO — HƯỚNG DẪN SKILL / RULE / WORKFLOW CHO VIBE CODING

> Dùng cho 4 thành viên (AI · Web Admin · App Core · UI/UX) với **Claude Code** và **Google Antigravity**. Đọc kèm `DueBro_MASTER_ARCHITECTURE_v3.md` (gọi tắt **ARCH**).
> Thông tin công cụ được tra cứu ngày 20/09/2026. Đường dẫn/lệnh của Antigravity và Expo thay đổi theo phiên bản — nếu lệnh không chạy, chạy `npx skills add --help` hoặc xem tài liệu chính thức của công cụ.

---

## 1. Ba khái niệm — đừng nhầm

| Khái niệm | Là gì | Dùng cho | Vị trí |
|---|---|---|---|
| **Rule** | Bối cảnh luôn được nạp mỗi phiên | Luật nghiệp vụ, stack, cấm kỵ | `AGENTS.md` (cả 2 công cụ đọc), `CLAUDE.md`, `GEMINI.md`, `.agents/rules/` |
| **Skill** | Gói hướng dẫn nạp **theo nhu cầu** (`SKILL.md` + file kèm) khi mô tả khớp việc đang làm | Kiến thức chuyên sâu (Supabase, Expo, Gemini…) | `.agents/skills/<tên>/SKILL.md` (Antigravity; bản cũ dùng `.agent/`), `.claude/skills/` (Claude Code) |
| **Workflow** | Chuỗi bước gọi bằng `/lệnh` | Quy trình lặp lại (tạo migration, kiểm tra trước merge) | `.agents/workflows/*.md` (Antigravity); `.claude/commands/*.md` (Claude Code) |

**Nguyên tắc vàng:** *Rule ngắn (< 1 trang) + Skill chuyên sâu + Workflow cho việc lặp.* Nhồi hết vào `AGENTS.md` làm agent "loãng" và tốn context.

---

## 2. Cài đặt 10 phút (làm 1 lần, commit vào repo để cả nhóm dùng chung)

```bash
# 0) Trong thư mục gốc repo duebro/
mkdir -p .agents/skills .agents/rules .agents/workflows docs
ln -s ../.agents/skills .claude/skills 2>/dev/null || true   # Windows: dùng Git Bash/WSL, hoặc để `npx skills` tự sao chép

# 1) Tài liệu nguồn sự thật
cp DueBro_MASTER_ARCHITECTURE_v3.md docs/ARCHITECTURE.md
cp DueBro_Project_Spec_v2.md docs/SPEC_v2.md

# 2) Cài skill bằng Skills CLI (tự phát hiện Claude Code / Antigravity / Cursor… trong máy bạn; chọn "Project" scope)
npx skills add supabase/agent-skills                     # supabase + supabase-postgres-best-practices
npx skills add anthropics/skills --skill frontend-design --skill skill-creator --skill webapp-testing
```

`AGENTS.md` (gốc repo) — **file rule duy nhất**; `CLAUDE.md` và `GEMINI.md` chỉ trỏ tới nó:

```markdown
<!-- AGENTS.md -->
# Due Bro — luật cho Agent
- Nguồn sự thật: docs/ARCHITECTURE.md (Mục 5–7, 14 là luật nghiệp vụ & AI). KHÔNG bịa luật nghiệp vụ; thiếu thì DỪNG và HỎI.
- Stack cố định: Expo/RN + TS, Supabase (Postgres/RLS/RPC/Edge), Next.js (admin). Không đổi công nghệ nếu không được duyệt.
- Mỗi người sở hữu 1 khu vực (ARCH Mục 3.2). KHÔNG sửa file ngoài khu vực của mình; cần đổi → nêu đề xuất, đừng tự sửa.
- DB: không sửa migration cũ (fix-forward). Mọi hàm SECURITY DEFINER phải `set search_path` + revoke public/anon. View phải nhúng kiểm tra quyền (ARCH Mục 9.1).
- Client không bao giờ ghi trực tiếp bảng nghiệp vụ; luôn qua RPC. Không đưa service_role vào client.
- Trước khi báo "xong": typecheck + lint; nếu đụng DB chạy supabase/tests/security_smoke_test.sql.
- Gặp mâu thuẫn giữa file: migration đã chạy > ARCHITECTURE > SPEC.
```
```markdown
<!-- CLAUDE.md -->
@AGENTS.md
```
```markdown
<!-- GEMINI.md -->
Đọc và tuân thủ toàn bộ AGENTS.md ở thư mục gốc.
```

**Antigravity:** rule đặt ở `AGENTS.md`/`GEMINI.md` (workspace) hoặc `.agents/rules/`; skill ở `.agents/skills/`; workflow ở `.agents/workflows/` (gõ `/tên-workflow`). Skill Gemini có thể có sẵn trong Antigravity ở *Customizations → Build with Google Plugins*, hoặc cài bằng `agy plugin install https://github.com/google-gemini/gemini-skills`.
**Claude Code:** `/plugin marketplace add <repo>` rồi `/plugin install …`; hoặc `npx skills add`.
**Viết skill dùng chung cho cả hai:** giữ hướng dẫn trung lập với model (làm bước 1, 2, 3 → trả về định dạng X), đừng viết "Bạn là Claude…" vì Antigravity có thể chạy bằng Gemini.

---

## 3. Bộ skill có sẵn — ai cần gì

Ký hiệu: ✅ nên cài · ➕ tùy chọn.

| Skill (nguồn) | Cài đặt | AI | Web Admin | App Core | UI/UX |
|---|---|:-:|:-:|:-:|:-:|
| **supabase** — mọi việc Supabase: RLS, Auth, Edge Functions, Realtime, Cron, CLI | `npx skills add supabase/agent-skills --skill supabase` | ✅ | ✅ | ✅ | |
| **supabase-postgres-best-practices** — index, RLS, schema, khóa/đồng thời | `… --skill supabase-postgres-best-practices` | ✅ | ➕ | ✅ | |
| **gemini-api-dev** (Google) — SDK Gemini, structured output, **cảnh báo model bị deprecate** | `npx skills add google-gemini/gemini-skills --skill gemini-api-dev` (hoặc có sẵn trong Antigravity) | ✅ | | | |
| Gemini Docs MCP — tra tài liệu Gemini mới nhất | `npx add-mcp "https://gemini-api-docs-mcp.dev"` | ✅ | | | |
| **expo** (plugin chính thức Expo): `expo-router`, `expo-native-ui`, `expo-data-fetching`, `expo-dev-client`, `expo-animation`, `expo-design-system`, `expo-tailwind-setup`, `expo-project-structure` | `npx skills add expo/skills` (Claude Code: `/plugin marketplace add expo/skills` → `/plugin install expo`) | | | ✅ | ✅ (`expo-design-system`, `expo-native-ui`) |
| **vercel-react-native-skills** — hiệu năng/kiến trúc React Native | `npx skills add vercel-labs/agent-skills --skill vercel-react-native-skills` | | | ✅ | |
| **vercel-react-best-practices**, **next-best-practices** | `npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices` (+ `next-best-practices` nếu có trong repo) | | ✅ | | |
| **web-design-guidelines** — kiểm tra UI theo chuẩn giao diện web | `… --skill web-design-guidelines` | | ✅ | | ✅ |
| **frontend-design** (Anthropic) — tránh giao diện "AI generic", chọn hướng thẩm mỹ rõ | `npx skills add anthropics/skills --skill frontend-design` | | ✅ | ✅ | ✅ |
| **webapp-testing** (Anthropic) — Playwright kiểm thử web | `… --skill webapp-testing` | | ✅ | | |
| **skill-creator** (Anthropic) — tạo/kiểm thử skill của riêng nhóm | `… --skill skill-creator` | ✅ | ✅ | ✅ | ✅ |
| **pptx / docx / xlsx / pdf** (Anthropic, dùng trong Claude.ai/Claude Code) — làm slide thuyết trình, báo cáo, bảng dữ liệu khảo sát | `/plugin marketplace add anthropics/skills` → `document-skills` | ➕ | | | ✅ (deck) |
| **find-skills** (Vercel) — agent tự đề xuất skill nên cài | `npx skills add vercel-labs/skills --skill find-skills` | ➕ | ➕ | ➕ | ➕ |
| **superpowers** (obra) — quy trình: brainstorming → viết plan → TDD → debug có hệ thống → review | xem hướng dẫn tại repo `obra/superpowers` (Claude Code plugin) | ➕ | ➕ | ➕ | |

Ghi chú:
- Số lượng skill lớn làm **tốn context** (mỗi skill nạp mô tả vào mọi phiên). Chỉ cài mục ✅ theo vai; đừng cài cả chợ.
- **An toàn:** skill có thể chứa script chạy được. Chỉ cài từ nguồn tin cậy (Anthropic, Google, Expo, Supabase, Vercel), **đọc `SKILL.md` + thư mục `scripts/` trước khi cài**, ghim phiên bản (commit) nếu được. Không cài skill "ăn theo" trên mạng chỉ vì tên hay.
- **MCP Supabase:** chỉ nối vào **DB local/staging**, không nối vào DB có dữ liệu thật (khuyến cáo của chính Supabase).
- Tên/lệnh trong bảng lấy từ tài liệu chính thức (Supabase, Expo, Google, Vercel, Anthropic) tại thời điểm tra cứu; nếu một skill đã đổi tên, dùng `npx skills add <repo> --list` để xem danh sách hiện tại.

---

## 4. Skill riêng của Due Bro (quan trọng nhất — tự tạo, commit vào `.agents/skills/`)

Skill chung chỉ dạy công nghệ; **skill riêng dạy "luật của Due Bro"** — đây là chỗ vibe coding không bị lệch nghiệp vụ. Mỗi skill < 150 dòng, chỉ *trỏ* vào ARCH thay vì chép lại (tránh lệch khi ARCH đổi).

| Skill | Ai dùng | Nội dung |
|---|---|---|
| `duebro-domain` | Mọi người | Hằng số & máy trạng thái (ARCH Mục 5), quy tắc "không bịa luật" |
| `duebro-supabase-security` | AI, Web, App Core | Checklist R1–R12 + cách chạy smoke test |
| `duebro-migration` | Người sở hữu migration | Quy trình tạo/kiểm tra migration |
| `duebro-ai-matching` | AI | Công thức `match_v1`, golden tests, không dùng từ "cosine" |
| `duebro-bro-persona` | AI | System prompt, guardrails, fallback, hạn mức LLM |
| `duebro-mobile` | App Core, UI/UX | Cấu trúc thư mục, mẫu gọi RPC + TanStack Query, mẫu optimistic update, trạng thái loading/rỗng/lỗi, bản đồ màn ⇄ dữ liệu (ARCH 11.2) |
| `duebro-admin` | Web Admin | Mẫu `admin_*` RPC, KPI (ARCH 10.3), Demo Controls |
| `duebro-design-system` | UI/UX, App Core, Web | Cách dùng `packages/design-tokens`, giọng Bro, mascot, quy tắc a11y |

**Ba skill mẫu (chép nguyên, sửa nhỏ nếu cần):**

`.agents/skills/duebro-domain/SKILL.md`
```markdown
---
name: duebro-domain
description: Luật nghiệp vụ Due Bro (chia việc, điểm Effort/Karma, dispute ẩn danh, SOS swap, quota tuần, escalation, matching). Dùng khi viết/sửa bất cứ logic nào liên quan việc nhà, điểm, thông báo, matching, trust.
---
# Due Bro — luật nghiệp vụ
1. Đọc docs/ARCHITECTURE.md: Mục 5 (Household), 6 (Matching), 7 (AI), 14 (quyết định). Đó là NGUỒN DUY NHẤT về luật.
2. Điểm chỉ được ghi trong `approve_task` (chỉ cron/service gọi). Không bao giờ UPDATE/DELETE `point_ledger`.
3. Client không đổi `task_instances.status` trực tiếp; luôn gọi RPC (claim_task, submit_task, dispute_task…).
4. Tuần & "hôm nay" theo giờ VN: dùng `vn_week_start()`; DB/cron chạy UTC.
5. Ẩn danh: không bao giờ đưa `requester_id`, `raised_by`, hay free-text dispute vào bất kỳ response/thông báo cho member.
6. Nếu yêu cầu cần một luật không có trong ARCHITECTURE Mục 5–7/14: DỪNG, nêu câu hỏi cụ thể cho người dùng. Không đoán.
7. Khi thay đổi hằng số/luật: cập nhật ARCHITECTURE (Mục 5.1/14) trong cùng PR.
```

`.agents/skills/duebro-supabase-security/SKILL.md`
```markdown
---
name: duebro-supabase-security
description: Checklist bảo mật Supabase cho Due Bro. Dùng bất cứ khi nào tạo/sửa bảng, view, policy, RPC, Edge Function, Storage, Realtime hoặc migration.
---
# Checklist (ARCH Mục 9.1) — tự kiểm tra từng mục trước khi báo xong
- [ ] Bảng mới: bật RLS; policy `to authenticated`; client KHÔNG có insert/update/delete trực tiếp nếu là bảng nghiệp vụ (`revoke`), ghi qua RPC.
- [ ] Hàm `security definer`: `set search_path = public, pg_temp`; có `auth.uid()` check; `revoke execute ... from public, anon`; `grant execute ... to authenticated` chỉ khi client cần.
- [ ] View: nhúng is_room_member()/is_connection_member()/is_ops() hoặc `with (security_invoker = true)` (xem R3). Materialized view: revoke khỏi anon/authenticated.
- [ ] Không thêm bảng vào `supabase_realtime` ngoài `messages`, `task_instances`.
- [ ] Không đưa service_role vào client; Edge Function kiểm tra JWT hoặc x-cron-secret.
- [ ] Chạy: supabase db reset && psql ... -f supabase/tests/security_smoke_test.sql  → phải "ALL PASSED". Thêm test cho đối tượng mới.
- [ ] Dán kết quả smoke test vào mô tả PR.
```

`.agents/skills/duebro-migration/SKILL.md`
```markdown
---
name: duebro-migration
description: Quy trình tạo migration Postgres/Supabase cho Due Bro. Dùng khi thêm/sửa schema, RPC, policy, cron.
---
1. Tạo file: `supabase migration new <tên_mô_tả>` (KHÔNG tự đặt số). Không sửa migration đã chạy; sai thì viết migration mới.
2. Chỉ sửa đối tượng thuộc khu vực của mình (ARCH 3.2). Đối tượng của người khác → đề xuất bằng issue/contract.
3. `alter type ... add value` phải ở file riêng, không dùng ngay trong cùng file.
4. Cron: dùng mẫu unschedule→schedule (idempotent); giờ theo UTC (bảng ARCH 8.3).
5. Kiểm: `supabase db reset` sạch → chạy security_smoke_test.sql → `pnpm gen:types` → commit database.ts.
6. Đổi chữ ký RPC = thay đổi contract: cập nhật docs/contracts/*.md + CHANGELOG và báo nhóm.
```

---

## 5. Workflow (gõ `/lệnh`)

Antigravity: file `.agents/workflows/<tên>.md`. Claude Code: cùng nội dung đặt ở `.claude/commands/<tên>.md` (gọi `/tên`). Dòng `// turbo` (Antigravity) cho phép tự chạy lệnh an toàn ngay dưới nó.

`new-migration.md`
```markdown
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
```

`pre-merge-check.md`
```markdown
---
description: Kiểm tra trước khi tạo PR
---
// turbo
1. Chạy typecheck và lint cho package bị ảnh hưởng.
2. Nếu có thay đổi trong supabase/: chạy `supabase db reset` + security_smoke_test.sql.
3. So sánh thay đổi với khu vực sở hữu (ARCH 3.2): liệt kê file nằm ngoài khu vực của tôi.
4. Soát lại theo skill duebro-domain: có luật nào tôi tự bịa không? Liệt kê.
5. Viết mô tả PR: mục ARCH đang thực hiện, cách kiểm tra, ảnh chụp màn hình nếu có UI.
```

`demo-rehearsal.md`
```markdown
---
description: Kiểm tra kịch bản demo 7 phút (ARCH Mục 1.3) và checklist Mục 13
---
1. Đọc ARCH Mục 1.3 và 13. Với từng bước demo, kiểm tra thành phần tương ứng đã có và chạy được (tra code/log), lập bảng ✅/❌.
2. Với mỗi ❌: nêu nguyên nhân gốc và đề xuất sửa nhỏ nhất.
3. Kiểm tra: GEMINI_MODEL còn hoạt động, cron đã chạy, push nhận được, seed đã nạp.
```

---

## 6. Làm việc song song 4 người (vibe coding không đụng nhau)

1. **Mỗi người 1 worktree** (`git worktree add ../duebro-ai feat/ai/...`), mở agent trong thư mục đó → agent không ghi đè file người khác.
2. **Contract-first:** trước khi vibe một RPC/Edge/màn hình dùng chung, nhờ agent viết `docs/contracts/<tên>.md` + zod schema, merge trước, người khác mock theo contract ngay.
3. **Types tự sinh** sau mỗi migration (`pnpm gen:types`); không viết tay type DB.
4. **Khu vực sở hữu** ghi ở `AGENTS.md` — nhắc agent: "chỉ sửa trong khu vực của tôi".
5. **Migration đặt tên theo timestamp** để không đụng số; mỗi migration 1 chủ.
6. **PR nhỏ**, người UI/UX duyệt mọi PR có giao diện, chủ module duyệt PR chạm module mình.
7. **Chốt phiên bản model/skill** trong repo (`docs/TOOLING.md`: ghi ai dùng công cụ gì, phiên bản Expo SDK, `GEMINI_MODEL`).

---

## 7. Mẫu prompt khởi động theo vai (dán vào agent ở đầu phiên)

**App Core**
```
Bạn làm việc trong khu vực apps/mobile và migration Household/Chat của Due Bro. Đọc AGENTS.md và docs/ARCHITECTURE.md Mục 3, 4.1–4.3, 5, 6, 11. 
Việc hôm nay: <ví dụ: màn Chi tiết việc với claim/submit/nudge/dispute theo ARCH 11.2>. 
Trước khi code: liệt kê RPC/bảng sẽ dùng và chữ ký của chúng (đọc từ database.ts), nêu chỗ nào ARCH chưa nói rõ và HỎI tôi. Dùng skill expo-router, expo-data-fetching, duebro-mobile. Xong thì chạy /pre-merge-check.
```
**AI**
```
Bạn làm việc trong supabase/functions (compute-matches, dispatch-notifications, auto-assign-tasks, seed-persona-reply), migration 016/018, supabase/seed, notebooks. Đọc AGENTS.md và ARCH Mục 4.4–4.5, 6, 7, 8. 
Việc hôm nay: <ví dụ: compute-matches theo Mục 7.1 kèm golden tests>. Bắt đầu bằng viết contract docs/contracts/matching.md và test, sau đó mới cài đặt. Không hard-code tên model Gemini (dùng env, tra skill gemini-api-dev). Mọi đầu ra LLM phải qua guardrails ở Mục 7.3.
```
**Web Admin**
```
Bạn làm việc trong apps/admin và migration 019. Đọc AGENTS.md và ARCH Mục 4.6, 9, 10. Admin chỉ dùng JWT ops + admin_* RPC (không service_role ở client). 
Việc hôm nay: <ví dụ: middleware kiểm tra role ops + màn Overview với KPI ở Mục 10.3 (dùng dữ liệu giả theo contract nếu RPC chưa xong)>. Dùng skill frontend-design, vercel-react-best-practices, supabase.
```
**UI/UX**
```
Bạn làm việc trong packages/design-tokens và docs/contracts/ux-*.md. Đọc ARCH Mục 1.3, 5.2, 6, 11. Sản phẩm là app chọn bạn ở ghép + vận hành nhà chung, mascot Bro giọng Gen Z Việt.
Việc hôm nay: <ví dụ: token màu/typography + prototype HTML cho luồng Onboarding→Match→Chat>. Liệt kê đủ trạng thái loading/rỗng/lỗi cho từng màn. Dùng skill frontend-design, expo-design-system.
```

**Mẹo vibe hiệu quả:** (1) yêu cầu agent *lập kế hoạch và liệt kê giả định trước khi code*; (2) một phiên = một việc nhỏ, có tiêu chí xong; (3) bắt agent **chạy** typecheck/smoke test rồi mới báo; (4) khi agent "sáng tạo" luật mới — bảo nó dừng và ghi thành câu hỏi; (5) sau mỗi cụm việc lớn, tạo/cập nhật skill riêng để lần sau khỏi giải thích lại.

---

## 8. Việc UI/UX nên tự vibe thêm (không cần code app)

- Prototype HTML bấm được cho kịch bản demo (ARCH 1.3) — giao cho App Core như "bản mẫu chuẩn".
- Bộ trạng thái mascot Bro (vui / cà khịa / SOS / ngủ) và bộ câu template dự phòng (phối hợp bạn AI, Mục 7.3).
- Deck thuyết trình bằng skill `pptx` (Claude): dùng Bảng Tầm nhìn vs MVP (ARCH 1.2) và "Nên/không nên nói" (ARCH 7.5).
