# Contract: Web Admin Portal & Demo Controls (Mục 10 ARCHITECTURE)

Tài liệu hợp đồng giữa **Web Admin (Next.js)** và **Database RPCs**. Web Admin **không** sử dụng `service_role` ở client; 100% sử dụng JWT của user có role `ops` (`auth.jwt() -> 'app_metadata' ->> 'role' = 'ops'`).

---

## 1. RPC: `admin_kpi_overview()`

- **Caller:** User có role `ops`
- **Output:**
  ```json
  {
    "total_users": 156,
    "dau": 42,
    "wau": 118,
    "total_rooms": 28,
    "active_tasks_this_week": 84,
    "on_time_rate": 0.89,
    "dispute_rate": 0.05,
    "silent_approval_rate": 0.92,
    "total_llm_cost_usd": 0.48,
    "total_llm_calls_today": 142,
    "fallback_rate": 0.02
  }
  ```

---

## 2. RPC: `admin_timeseries(p_metric text, p_days int default 14)`

- **Caller:** Role `ops`
- **Parameters:**
  - `p_metric`: `'dau' | 'tasks_completed' | 'matches'`
  - `p_days`: `integer` (1 - 90, mặc định 14)
- **Output:**
  ```json
  [
    { "date": "2026-09-08", "value": 35 },
    { "date": "2026-09-09", "value": 42 }
  ]
  ```

---

## 3. RPC: `admin_matching_funnel()`

- **Caller:** Role `ops`
- **Output:**
  ```json
  {
    "total_registered": 156,
    "profiles_completed": 140,
    "users_swiped": 112,
    "connections_formed": 48,
    "users_chatted": 36,
    "rooms_created_from_match": 14
  }
  ```

---

## 4. RPC: `admin_household_health()`

- **Caller:** Role `ops`
- **Output:**
  ```json
  {
    "total_overdue_tasks": 3,
    "total_active_tasks": 24,
    "rooms_health": [
      {
        "room_id": "bbbbbbbb-0000-0000-0000-000000000001",
        "room_name": "Nhà Trọ Xanh 402",
        "member_count": 3,
        "open_tasks": 4,
        "completed_tasks": 18
      }
    ]
  }
  ```

---

## 5. RPC: `admin_llm_usage(p_days int default 7)`

- **Caller:** Role `ops`
- **Parameters:**
  - `p_days`: `integer` (mặc định 7)
- **Output:**
  ```json
  {
    "total_calls": 240,
    "fallback_calls": 4,
    "fallback_rate": 0.02,
    "total_input_tokens": 48000,
    "total_output_tokens": 12000,
    "avg_latency_ms": 1120,
    "calls_by_purpose": {
      "bro_message": 180,
      "match_reason": 45,
      "seed_reply": 15
    }
  }
  ```

---

## 6. RPC: `admin_list_disputes(p_limit int default 50)`

- **Caller:** Role `ops`
- **Mục đích:** Ops xem toàn bộ lịch sử khiếu nại **kèm danh tính** (`raised_by`, `reason`) để xử lý xung đột hoặc gian lận.
- **Output:**
  ```json
  [
    {
      "dispute_id": "uuid",
      "task_id": "uuid",
      "task_title": "Dọn nhà vệ sinh",
      "room_id": "uuid",
      "room_name": "Phòng 301",
      "raised_by": "uuid",
      "raised_by_name": "Minh Tuấn",
      "claimed_by": "uuid",
      "claimed_by_name": "Hoàng Nam",
      "reason_code": "not_clean",
      "reason": "Sàn còn dính xà phòng và gương chưa lau",
      "status": "open",
      "created_at": "2026-09-21T03:00:00Z"
    }
  ]
  ```

---

## 7. RPC: `admin_cron_status()`

- **Caller:** Role `ops`
- **Output:**
  ```json
  [
    {
      "jobid": 1,
      "jobname": "job_silent_approval_every_30m",
      "schedule": "*/30 * * * *",
      "active": true,
      "last_run": {
        "status": "succeeded",
        "start_time": "2026-09-21T03:30:00Z",
        "end_time": "2026-09-21T03:30:02Z"
      }
    }
  ]
  ```

---

## 8. Demo Controls (RPCs phục vụ kịch bản demo 7 phút)

### `admin_demo_force_approve(p_task_id uuid)`
- **Caller:** Role `ops`
- **Mục đích:** Bỏ qua cửa sổ chờ 6 tiếng Silent Approval, gọi trực tiếp `approve_task` để cộng điểm Effort & Karma ngay lập tức trước mặt giám khảo.
- **Input:** `{ p_task_id: "uuid" }`
- **Output:** Bản ghi `task_instances` với `status = 'completed'`.

### `admin_demo_run_job(p_job text)`
- **Caller:** Role `ops`
- **Mục đích:** Kích hoạt chạy ngay một job nền (không cần đợi pg_cron theo chu kỳ).
- **Whitelist jobs:** `'silent_approval' | 'escalate' | 'expire' | 'refresh_features' | 'weekly_targets'`
- **Output:**
  ```json
  {
    "job": "escalate",
    "status": "executed",
    "escalated_count": 2
  }
  ```
