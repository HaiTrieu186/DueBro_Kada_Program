# Contract: UX Screens & Screen States (Mục 11 ARCHITECTURE)

Tài liệu hợp đồng giữa **UI/UX Designer** và **App Core (Mobile Developer)** quy định danh mục 14 màn hình di động bắt buộc cho MVP và chuẩn mực 3 trạng thái giao diện.

---

## 1. Nguyên Tắc Thiết Kế Bắt Buộc (UX Commandments)

1. **Bộ Ba Trạng Thái Bắt Buộc:** Tuyệt đối không để màn hình bị trắng tinh khi dữ liệu đang tải, rỗng hoặc bị lỗi mạng.
   - **Loading State:** Skeleton placeholder (không dùng Spinner tròn đơn điệu gây sốt ruột).
   - **Empty State:** Hình mascot Bro theo đúng trạng thái cảm xúc kèm 1 câu gợi ý hành động cụ thể.
   - **Error State:** Câu thông báo lỗi bằng ngôn ngữ tự nhiên, giọng Bro thân thiện + nút "Thử lại" (Retry).
2. **Kích Thước Vùng Chạm:** Vùng bấm tối thiểu **44px × 44px** (theo chuẩn WCAG 2.1 AA).
3. **Cập Nhật Lạc Quan (Optimistic UI):** Nút nhận việc, like thẻ, gửi tin nhắn chat phải phản hồi ngay lập tức trên UI (dưới 100ms) trước khi RPC trả về kết quả.

---

## 2. Bản Đồ 14 Màn Hình Cốt Lõi (Screen Map & State Table)

| STT | Tên Màn Hình | Route File (`apps/mobile`) | Trạng thái Loading | Trạng thái Rỗng (Empty) | Trạng thái Lỗi (Error) |
|:---:|---|---|---|---|---|
| **1** | **Đăng Nhập / Đăng Ký** | `app/(auth)/login.tsx` | Nút hiển thị loader | — | Sai mật khẩu / email chưa kích hoạt |
| **2** | **Onboarding 4 bước** | `app/(auth)/onboarding.tsx` | Form skeleton | — | Báo đỏ trường thiếu thông tin |
| **3** | **Khám Phá (Matching)** | `app/(app)/discovery.tsx` | Skeleton thẻ ứng viên | Bro ngủ: *"Hiện chưa có bạn nào phù hợp, thử nới rộng khoảng ngân sách xem sao!"* | Lỗi mạng / Thử lại |
| **4** | **Chi Tiết Ứng Viên** | `app/candidate/[id].tsx` | Profile skeleton | — | Ứng viên không tồn tại |
| **5** | **Modal "Match!"** | `app/modal/match.tsx` | Hiệu ứng bung nổ (Celebration) | — | — |
| **6** | **Hộp Chat (Realtime)** | `app/chat/[id].tsx` | Bong bóng tin nhắn skeleton | Bro vui: *"Hai bạn đã kết nối! Hãy chào nhau câu đầu tiên đi nào."* | Tin nhắn gửi lỗi có chấm đỏ thử lại |
| **7** | **Đề Xuất "Cùng Thuê Nhé?"** | `app/room/propose.tsx` | Indicator chờ duyệt | Chờ đối phương phản hồi | Hết hạn đề xuất |
| **8** | **Bounty Board (Việc Mở)** | `app/(app)/index.tsx` | Card việc skeleton | Bro vui: *"Phòng sạch bong kin kít! Chưa có việc mới nào cần làm."* | Lỗi tải danh sách việc |
| **9** | **Việc Của Tôi** | `app/(app)/my-tasks.tsx` | Card việc skeleton | Bro cà khịa: *"Bạn chưa nhận việc nào cả. Vào Bounty Board săn điểm ngay đi!"* | Lỗi tải dữ liệu |
| **10**| **Chi Tiết Việc (Nộp ảnh)** | `app/chore/[id].tsx` | Chi tiết việc skeleton | — | Task đã bị người khác nhận trước |
| **11**| **Tạo Việc Mới** | `app/chore/add.tsx` | Nút lưu loading | — | Ngày hạn trong quá khứ / thiếu tên |
| **12**| **Bảng Xếp Hạng Tuần** | `app/(app)/scoreboard.tsx`| Leaderboard skeleton | Bro tươi: *"Tuần mới vừa bắt đầu, chưa ai có điểm. Mau nhận việc mở bát!"* | Lỗi tải điểm số |
| **13**| **Thành Viên & Mã Mời** | `app/room/members.tsx` | Danh sách thành viên skeleton | — | Mã mời hết hạn |
| **14**| **Hộp Thông Báo** | `app/(app)/notifications.tsx`| Notification skeleton | Bro ngủ: *"Hộp thư trống trơn, bạn rất chăm chỉ nên Bro chưa cần réo!"* | Lỗi tải thông báo |

---

## 3. Deep Linking Scheme

Ứng dụng hỗ trợ các liên kết mở trực tiếp (Deep links) từ Push Notification:
- `duebro://task/{task_id}`: Mở thẳng màn hình Chi tiết việc nhà cần làm.
- `duebro://chat/{connection_id}`: Mở thẳng cuộc trò chuyện với bạn match.
- `duebro://room/{room_id}`: Mở thẳng bảng tin phòng trọ.
