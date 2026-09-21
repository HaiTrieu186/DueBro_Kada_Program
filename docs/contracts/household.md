# Contract: Household Management (Mục 5 ARCHITECTURE)

Tài liệu hợp đồng giữa **App Core (Mobile)** và **Database/Supabase RPC**. Client không gọi INSERT/UPDATE trực tiếp vào bảng nghiệp vụ, 100% gọi qua RPC.

---

## 1. RPC: Tạo và Tham gia phòng

### `create_room(p_name text)`
- **Caller:** Authenticated user (chưa thuộc phòng nào hoặc đã rời phòng)
- **Input:**
  - `p_name`: `string` (Tên phòng, 3 - 50 ký tự)
- **Output:**
  - `table (room_id uuid, invite_code text)`
- **Behavior:**
  - Tạo bản ghi mới trong `rooms`.
  - Tự động gán user gọi hàm thành `host` trong `room_members`.
  - Sinh mã mời ngẫu nhiên 6 ký tự viết hoa/số.

### `join_room(p_invite_code text)`
- **Caller:** Authenticated user
- **Input:**
  - `p_invite_code`: `string` (Mã mời 6 ký tự)
- **Output:**
  - `table (room_id uuid)`
- **Errors:**
  - `ROOM_NOT_FOUND`: Mã mời không tồn tại.
  - `ALREADY_IN_ROOM`: User đang thuộc một phòng khác chưa rời.
  - `ROOM_FULL`: Phòng đã đạt giới hạn thành viên (mặc định tối đa 6).

---

## 2. RPC: Vòng đời Việc Nhà (Chore Lifecycle)

### `create_adhoc_task(p_room_id uuid, p_title text, p_category task_category, p_effort_points int, p_due_date timestamptz)`
- **Caller:** Thành viên bất kỳ trong phòng
- **Input:**
  - `p_room_id`: `uuid`
  - `p_title`: `string`
  - `p_category`: `'cleaning' | 'trash' | 'kitchen' | 'shopping' | 'maintenance' | 'other'`
  - `p_effort_points`: `integer` (5 - 100). Nếu ≥ 30 thì tự động đánh dấu `requires_photo = true`.
  - `p_due_date`: `timestamptz` (Bắt buộc lớn hơn `now()`).
- **Output:**
  - `uuid` (ID của `task_instances` vừa tạo)
- **State ban đầu:** `status = 'open'`, `assigned_to = null`.

### `claim_task(p_task_id uuid)`
- **Caller:** Thành viên trong phòng
- **Input:**
  - `p_task_id`: `uuid`
- **Output:**
  - `jsonb`: `{ ok: true, effort_bonus: 1.10 }`
- **Behavior:**
  - Chuyển `status = 'in_progress'`, gán `assigned_to = auth.uid()`.
  - Gắn nhãn nhận việc tự nguyện (+10% Effort Points khi hoàn thành).
  - Khóa đồng thời `FOR UPDATE` tránh 2 người cùng nhận 1 lúc.

### `submit_task(p_task_id uuid, p_photo_url text)`
- **Caller:** Người đang được gán task (`assigned_to == auth.uid()`)
- **Input:**
  - `p_task_id`: `uuid`
  - `p_photo_url`: `text` (Bắt buộc nếu task có `requires_photo = true`)
- **Output:**
  - `jsonb`: `{ ok: true, submitted_at: timestamptz }`
- **Behavior:**
  - Chuyển `status = 'submitted'`, lưu `proof_photo_url`.
  - Bắt đầu cửa sổ Silent Approval 6 tiếng.

### `request_nudge(p_task_id uuid)`
- **Caller:** Thành viên cùng phòng (khác người làm)
- **Input:**
  - `p_task_id`: `uuid`
- **Behavior:**
  - Kích hoạt thông báo nhắc nhở ẩn danh tới người làm. Không ghi `requester_id` vào thông báo của người nhận.

### `dispute_task(p_task_id uuid, p_reason_code text, p_reason text)`
- **Caller:** Thành viên cùng phòng (khác người làm)
- **Input:**
  - `p_task_id`: `uuid`
  - `p_reason_code`: `'not_clean' | 'incomplete' | 'wrong_task' | 'fake_photo' | 'other'`
  - `p_reason`: `text` (Ghi chú nội bộ, chỉ Ops xem được)
- **Output:**
  - `jsonb`: `{ ok: true }`
- **Behavior:**
  - Chuyển `status = 'disputed'`.
  - Người làm chỉ nhìn thấy `p_reason_code` được chuẩn hóa, danh tính người khiếu nại được che chắn bởi **Anonymity Shield**.
