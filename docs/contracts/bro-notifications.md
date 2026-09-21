# Contract: Bro Notifications & Persona (Mục 7.3 & Mục 8 ARCHITECTURE)

Tài liệu hợp đồng giữa **Hệ thống Thông báo (pg_cron / Database Triggers)**, **AI Edge Function (`dispatch-notifications`)**, và **Ứng dụng Di Động (Expo Push)**.

---

## 1. Các Cấp Độ Thông Báo (Notification Escalation Levels)

| Mức độ (`level`) | Thời điểm kích hoạt | Giọng điệu (Persona Tone) | Kênh gửi | Nguồn tạo câu (Source) |
|---|---|---|---|---|
| **`gentle`** (T1) | Trước hạn 2 tiếng | Nhắc nhở thân mật, ngắn gọn | Push + In-app | Template cố định |
| **`sarcastic`** (T2) | Quá hạn 2h – 6h | Cà khịa hài hước Gen Z, giục giã | Push + In-app | **Google Gemini LLM** (Fallback: Template) |
| **`sos`** (T3) | Quá hạn > 12h | Nghiêm túc, cảnh báo trừ điểm & uy tín | Push toàn phòng | **Google Gemini LLM** (Fallback: Template) |
| **`system`** (T4) | Duyệt việc, nhận điểm, match | Tươi vui, khích lệ | In-app | Template cố định |

---

## 2. Đặc Tả Dữ Liệu Hàng Đợi (`notifications_log`)

Khi có sự kiện quá hạn hoặc cần nhắc việc, Database sẽ chèn bản ghi vào bảng `notifications_log`:

```ts
interface NotificationQueueItem {
  id: string; // uuid
  recipient_id: string; // uuid của thành viên nhận tin
  task_id?: string; // uuid của việc nhà liên quan (nếu có)
  kind: 'chore' | 'match' | 'system' | 'dispute';
  level: 'gentle' | 'sarcastic' | 'sos' | 'system';
  message: string; // Tin nhắn mặc định (template)
  push_status: 'pending' | 'sent' | 'failed' | 'skipped';
  is_llm: boolean;
  created_at: string;
}
```

---

## 3. Quy Trình Xử Lý Trong Edge Function `dispatch-notifications`

1. **Nhận việc:** Hàm RPC `claim_pending_notifications(p_limit int)` lấy ra tối đa 50 thông báo đang ở trạng thái `pending`.
2. **Sinh nội dung bằng LLM (nếu là `sarcastic` hoặc `sos`):**
   - Kiểm tra hạn mức người dùng: `underQuota(recipient_id)`.
   - Gọi **Google Gemini API** (`gemini-2.5-flash` qua `@google/genai`) với prompt persona Bro:
     - *System Prompt:* "Mày là Bro, bạn cùng phòng Gen Z vui tính nhưng nghiêm túc về việc nhà. Hãy viết 1 câu nhắc nhở ngắn gọn (dưới 20 từ), hài hước, hơi cà khịa nhưng không thô tục."
     - *Timeout:* 6 giây.
     - *Guardrails:* Kiểm tra đầu ra không chứa từ ngữ cấm/thô tục.
   - Nếu gọi LLM lỗi hoặc quá 6 giây: Giữ nguyên câu `message` mẫu (Fallback template).
   - Ghi nhật ký vào `llm_usage_log`.
3. **Bắn Push Notification qua Expo Push Service:**
   - Lấy `push_token` từ bảng `profiles`.
   - Gửi payload chuẩn tới `https://exp.host/--/api/v2/push/send`.
   - Cập nhật trạng thái `push_status = 'sent'`.

---

## 4. Bộ Câu Mẫu Dự Phòng (Fallback Templates)

Khi không có kết nối internet hoặc API Gemini gặp sự cố, hệ thống tự động sử dụng danh sách câu mẫu sau:

### Cà khịa (`sarcastic`):
- *"Bát đĩa trong bồn đang chuẩn bị tiến hóa thành nền văn minh mới rồi kìa bro!"*
- *"Hạn chót qua rồi mà việc vẫn nằm yên như tình cảm của crush vậy đó."*
- *"Bro ơi, việc nhà không tự làm được đâu, trừ khi bạn có phép thuật Winx!"*

### Khẩn cấp (`sos`):
- *"CẢNH BÁO SOS: Việc nhà đã quá hạn hơn 12 tiếng. Điểm uy tín của bạn đang bị ảnh hưởng nghiêm trọng!"*
- *"Tình hình căng thẳng! Cả phòng đang chờ bạn hoàn thành việc nhà để chốt sổ tuần này."*
