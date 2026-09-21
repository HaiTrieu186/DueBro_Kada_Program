# Contract: Matching Engine & Chat (Mục 6 ARCHITECTURE)

Tài liệu hợp đồng giữa **App Core (Mobile)** và **AI Engine / Edge Functions**.

---

## 1. Edge Function: `compute-matches`

- **Endpoint:** `POST /functions/v1/compute-matches`
- **Headers:** `Authorization: Bearer <user_jwt>`
- **Request Body:**
  ```json
  {
    "city": "Hồ Chí Minh",
    "district": "Quận 10",
    "page": 1,
    "limit": 20
  }
  ```
- **Response Body:**
  ```json
  {
    "suggestions": [
      {
        "candidate_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "display_name": "Minh Tuấn",
        "avatar_url": "https://...",
        "compatibility_pct": 86,
        "matching_reasons": [
          "Cùng thói quen ngủ sớm dậy sớm (23h - 6h30)",
          "Mức ngân sách tương đồng (3.0M - 4.5M)"
        ],
        "consideration": "Tuấn thích nuôi mèo, bạn chưa có tiền sử nuôi thú cưng",
        "trust_score": 88,
        "is_seed_data": true
      }
    ]
  }
  ```

---

## 2. RPC: `swipe` (Tương tác Thẻ Matching)

- **Caller:** Authenticated user
- **Input:**
  - `p_target_user_id`: `uuid`
  - `p_action`: `'like' | 'pass'`
- **Output:**
  ```json
  {
    "matched": true,
    "connection_id": "c1a2b3c4-...",
    "matched_user": {
      "id": "9b1deb4d-...",
      "display_name": "Minh Tuấn"
    }
  }
  ```
- **Behavior:**
  - Ghi bản ghi vào `lifestyle_swipes`.
  - Nếu hai bên đều `like` nhau -> tự động sinh bản ghi trong `match_connections` với `status = 'matched'`.
  - Trả về `matched = true` kèm `connection_id` để mobile mở ngay màn hình Chat.

---

## 3. Realtime Chat: Kênh Trao Đổi Giữa Hai Người

- **Bảng:** `messages`
- **Realtime Filter:** `connection_id=eq.<connection_id>`
- **Cấu trúc bản ghi:**
  ```ts
  interface Message {
    id: string;
    connection_id: string;
    sender_id: string;
    content: string;
    created_at: string;
  }
  ```
- **Hành động chuyển đổi:**
  - Sau khi chat đạt thỏa thuận, một trong hai người bấm "Cùng thuê nhé?":
  - Gọi RPC: `propose_room(p_connection_id uuid, p_room_name text)`.
  - Đối phương bấm chấp nhận -> gọi RPC `accept_room(p_connection_id uuid)`.
  - Hệ thống tự động tạo phòng trong `rooms` và đưa cả 2 vào chung phòng.
