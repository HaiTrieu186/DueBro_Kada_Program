# Contract: Web Admin Portal & Demo Controls (Mục 10 ARCHITECTURE)

Tài liệu hợp đồng giữa **Web Admin (Next.js)** và **Database RPCs**. Web Admin **không** sử dụng `service_role` ở client; 100% sử dụng JWT của user có role `ops`.

---

## 1. RPC: `admin_get_overview_kpis()`

- **Caller:** User có role `ops` (hoặc `app_metadata.role = 'ops'`)
- **Output:**
  ```json
  {
    "total_rooms": 12,
    "active_members": 38,
    "tasks_completed_this_week": 142,
    "chore_completion_rate": 0.89,
    "total_llm_cost_usd": 1.45,
    "total_disputes_pending": 2
  }
  ```

---

## 2. RPC: `admin_fast_forward_approval(p_hours int)` (Demo Controls)

- **Caller:** Role `ops`
- **Mục đích:** Hỗ trợ kịch bản Demo 7 phút. Thay vì phải chờ cửa sổ 6 tiếng Silent Approval, Admin bấm nút trên dashboard để tua nhanh thời gian duyệt.
- **Input:**
  - `p_hours`: `integer` (mặc định 6)
- **Output:**
  ```json
  {
    "approved_tasks_count": 3,
    "points_distributed": 99,
    "timestamp": "2026-09-21T08:50:00Z"
  }
  ```

---

## 3. RPC: `admin_force_approve_task(p_task_id uuid)`

- **Caller:** Role `ops`
- **Mục đích:** Can thiệp giải quyết Dispute trong trường hợp các thành viên không thống nhất được.
- **Input:**
  - `p_task_id`: `uuid`
- **Behavior:**
  - Chuyển `task_instances.status = 'completed'`.
  - Cộng điểm Effort & Karma cho người làm.
