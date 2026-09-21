# Contract: Household Management (Mục 5 ARCHITECTURE)

Tài liệu hợp đồng giữa **App Core (Mobile)** và **Database/Supabase RPC**. Client không gọi INSERT/UPDATE trực tiếp vào bảng nghiệp vụ, 100% gọi qua RPC (`SECURITY DEFINER` có `set search_path = public, pg_temp`).

---

## 1. RPC: Tạo và Tham gia phòng

### `create_room(p_name text) -> rooms`
- **Caller:** Authenticated user
- **Input:**
  - `p_name`: `string` (Tên phòng, 2 - 50 ký tự)
- **Output:**
  - Bản ghi `rooms` (chứa `id`, `name`, `invite_code`, `created_by`, `created_at`).
- **Behavior:**
  - Tạo bản ghi mới trong `rooms`.
  - Tự động gán user gọi hàm thành `host` trong `room_members`.
  - Sinh mã mời ngẫu nhiên 6 ký tự viết hoa/số.
  - Tự động khởi tạo `weekly_quota_targets` 60 điểm cho host.

### `join_room(p_invite_code text) -> rooms`
- **Caller:** Authenticated user
- **Input:**
  - `p_invite_code`: `string` (Mã mời 6 ký tự)
- **Output:**
  - Bản ghi `rooms`.
- **Errors:**
  - `Mã phòng không tồn tại`
  - `Phòng đã đủ thành viên` (Mặc định tối đa 4)
  - `Bạn đã ở trong phòng này rồi`

### `leave_room(p_room_id uuid, p_new_host_id uuid default null) -> void`
- **Caller:** Thành viên trong phòng (`is_room_member(room_id)`)
- **Behavior:**
  - Đánh dấu `left_at = now()` trong `room_members`.
  - Nếu là Host và phòng còn người khác, bắt buộc truyền `p_new_host_id` để chuyển quyền Trưởng phòng.
  - Các task người này đang nhận tự động mở lại về `open` (`reopen_tasks_on_member_leave`).

---

## 2. RPC: Vòng đời Việc Nhà (Chore Lifecycle)

### `create_adhoc_task(p_room_id uuid, p_title text, p_category text, p_effort_points int, p_due_at timestamptz) -> task_instances`
- **Caller:** Thành viên bất kỳ trong phòng
- **Input:**
  - `p_room_id`: `uuid`
  - `p_title`: `string` (2 - 100 ký tự)
  - `p_category`: `'cleaning' | 'trash' | 'kitchen' | 'shopping' | 'maintenance' | 'other'`
  - `p_effort_points`: `integer` (5 - 100). Nếu ≥ 30 thì tự động đánh dấu `requires_photo = true`.
  - `p_due_at`: `timestamptz` (Bắt buộc lớn hơn `now()`).
- **Output:**
  - Bản ghi `task_instances` vừa tạo (`status = 'open'`, `claimed_by = null`).

### `claim_task(p_task_id uuid) -> task_instances`
- **Caller:** Thành viên trong phòng (không ở chế độ `away`)
- **Input:**
  - `p_task_id`: `uuid`
- **Output:**
  - Bản ghi `task_instances` với `status = 'claimed'`, `claimed_by = auth.uid()`.
- **Behavior:**
  - Gắn `assignment_method = 'volunteer'`, `bonus_multiplier = 1.1` (+10% Effort Points khi hoàn thành).
  - Khóa đồng thời `FOR UPDATE` tránh 2 người cùng nhận 1 lúc.

### `submit_task(p_task_id uuid, p_photo_path text default null) -> task_instances`
- **Caller:** Người đang nhận task (`claimed_by == auth.uid()`)
- **Input:**
  - `p_task_id`: `uuid`
  - `p_photo_path`: `text` (Bắt buộc nếu `requires_photo = true`; phải có tiền tố `{room_id}/`)
- **Output:**
  - Bản ghi `task_instances` với `status = 'pending_approval'`, `submitted_at = now()`.
- **Behavior:**
  - Bắt đầu cửa sổ Silent Approval 6 tiếng.
  - Tự động đóng dispute cũ nếu task đang bị `disputed`.

### `request_nudge(p_task_id uuid) -> void`
- **Caller:** Thành viên cùng phòng (khác người làm)
- **Input:**
  - `p_task_id`: `uuid`
- **Behavior:**
  - Giới hạn: 1 lần / 6 giờ / người / việc.
  - Gửi thông báo ẩn danh tới người làm: *"Có bạn cùng phòng nhờ Bro nhắc: '{title}' nhé 👀"*. Người làm không biết ai đã nhắc.

### `dispute_task(p_task_id uuid, p_reason_code text, p_reason text default null) -> task_instances`
- **Caller:** Thành viên cùng phòng (khác người làm)
- **Input:**
  - `p_task_id`: `uuid`
  - `p_reason_code`: `'not_clean' | 'missing_photo' | 'wrong_task' | 'other'` (Preset hiển thị công khai)
  - `p_reason`: `text` (Ghi chú tự do, chỉ lưu cho Admin/Ops, che giấu khỏi mobile)
- **Output:**
  - Bản ghi `task_instances` với `status = 'disputed'`.
- **Behavior:**
  - Tối đa 2 dispute / task.
  - Gửi thông báo ẩn danh cho người làm yêu cầu làm lại và nộp lại.

### `resolve_dispute(p_task_id uuid, p_decision text) -> task_instances`
- **Caller:** Chỉ Trưởng phòng (`role = 'host'`)
- **Input:**
  - `p_task_id`: `uuid`
  - `p_decision`: `'uphold'` (Làm lại -> về `claimed`) | `'dismiss'` (Bác khiếu nại -> về `pending_approval`)

---

## 3. RPC: Tính Năng Nâng Cao (SOS Swap, Away Mode, Karma Shop)

### `request_swap(p_task_id uuid) -> swap_requests`
- **Caller:** Chủ việc (`claimed_by = auth.uid()`), tối đa 2 lần/tuần.
- **Behavior:** Gửi thông báo tới cả phòng kêu gọi cứu hộ.

### `accept_swap(p_swap_id uuid) -> task_instances`
- **Caller:** Thành viên khác trong phòng, không ở chế độ Away.
- **Behavior:** Chuyển `original_owner_id = requested_by`, `claimed_by = auth.uid()`, `assignment_method = 'sos_swap'`. Người nhận hộ được hưởng bonus Effort và Karma khi hoàn thành.

### `cancel_swap(p_swap_id uuid) -> void`
- **Caller:** Người tạo swap request.

### `set_away_mode(p_room_id uuid, p_from date, p_to date) -> room_members`
- **Caller:** Thành viên trong phòng (tối đa 30 ngày).
- **Behavior:** Không bị Auto-Assign, giảm target tuần tương ứng.

### `clear_away_mode(p_room_id uuid) -> room_members`
- **Caller:** Thành viên trở lại hoạt động bình thường.

### `redeem_karma(p_room_id uuid, p_reward_type text) -> karma_redemptions`
- **Caller:** Thành viên có số dư Karma ≥ 30 (`p_reward_type = 'skip_next_task'`).
- **Behavior:** Tự động trừ 30 Karma, không cần Host duyệt; được bỏ qua 1 lần Auto-Assign kế tiếp.
