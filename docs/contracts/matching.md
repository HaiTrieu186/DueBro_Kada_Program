# Contract: Matching Engine, Chat & Trust Score (Mục 6 ARCHITECTURE)

Tài liệu hợp đồng giữa **App Core (Mobile)** và **AI Engine / Edge Functions**.

---

## 1. Edge Function: `compute-matches`

- **Endpoint:** `POST /functions/v1/compute-matches`
- **Headers:** `Authorization: Bearer <user_jwt>`
- **Request Body:**
  ```json
  {
    "limit": 20
  }
  ```
- **Response Body:**
  ```json
  {
    "model_version": "match_v1",
    "count": 12,
    "suggestions": [
      {
        "candidate_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "compatibility_score": 0.88,
        "breakdown": {
          "wake": 1.0,
          "sleep": 0.83,
          "tidiness": 1.0,
          "noise": 0.75,
          "budget": 1.0,
          "smokes": 1.0,
          "pet": 1.0,
          "guest_freq": 0.67,
          "occupation": 1.0
        },
        "reasons": {
          "strengths": [
            "Cùng thói quen ngủ sớm dậy sớm (lệch ~1h)",
            "Ngân sách trùng khớp hoàn toàn (3.0tr - 4.5tr)"
          ],
          "conflicts": [
            "Tần suất dẫn bạn bè về nhà hơi khác nhau"
          ]
        }
      }
    ]
  }
  ```

---

## 2. RPC: `swipe(p_candidate_id uuid, p_action text)`

- **Caller:** Authenticated user
- **Input:**
  - `p_candidate_id`: `uuid`
  - `p_action`: `'liked' | 'passed'`
- **Output:**
  ```json
  {
    "matched": true,
    "connection_id": "c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c"
  }
  ```
- **Behavior:**
  - Ghi bản ghi vào `match_actions`.
  - Nếu cả hai cùng `liked` (hoặc candidate là hồ sơ seed mô phỏng `is_seed_data = true` cho demo) -> tạo bản ghi `match_connections(user_a_id, user_b_id, status='chatting')`.
  - Trả về `matched = true` kèm `connection_id`.

---

## 3. Realtime Chat: Kênh Trao Đổi Giữa Hai Người

- **Bảng:** `messages`
- **Realtime Channel Filter:** `connection_id=eq.<connection_id>`
- **Cấu trúc bản ghi:**
  ```ts
  interface Message {
    id: number;
    connection_id: string;
    sender_id: string;
    content: string;
    created_at: string;
  }
  ```
- **RLS:** Chặn người ngoài kết nối đọc và gửi tin (`is_connection_member`). Cấm sửa và xóa (`revoke update, delete`).

---

## 4. Chuyển Đổi Từ Match Sang Phòng Chung

### `propose_room(p_connection_id uuid, p_room_name text) -> match_connections`
- **Caller:** Thành viên trong kết nối chat
- **Behavior:** Chuyển `match_connections.status = 'room_proposed'`, ghi nhận `proposed_by` và `proposed_room_name`.

### `accept_room(p_connection_id uuid) -> rooms`
- **Caller:** Người còn lại trong kết nối (khác `proposed_by`)
- **Behavior:**
  - Tạo phòng trong `rooms`.
  - Thêm người đề xuất làm `host`, người chấp nhận làm `member`.
  - Khởi tạo `weekly_quota_targets` 60 điểm cho cả 2 người.
  - Cập nhật `match_connections.status = 'housed'` và gắn `room_id`.

---

## 5. RPC: `get_user_trust(p_user_id uuid) -> jsonb`

- **Caller:** Authenticated user (có quyền xem: chính mình, cùng phòng, cùng kết nối chat, hoặc có trong gợi ý match)
- **Output:**
  ```json
  {
    "score": 87,
    "level": "gold",
    "resolved_count": 14,
    "on_time_rate": 0.93,
    "dispute_count": 1,
    "is_provisional": false,
    "is_simulated": false
  }
  ```
- **Levels:**
  - `resolved_count < 5`: `"new"` (provisional, badge "Mới")
  - `score >= 85`: `"gold"` (badge Vàng)
  - `score >= 70`: `"silver"` (badge Bạc)
  - Còn lại: `"bronze"` (badge Đồng)
  - Nếu `is_seed_data = true`: cờ `is_simulated = true` (badge "Hồ sơ mô phỏng").
