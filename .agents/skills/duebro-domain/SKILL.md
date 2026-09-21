---
name: duebro-domain
description: Luật nghiệp vụ Due Bro (chia việc, điểm Effort/Karma, dispute ẩn danh, SOS swap, quota tuần, escalation, matching). Dùng khi viết/sửa bất cứ logic nào liên quan việc nhà, điểm, thông báo, matching, trust.
---
# Due Bro — luật nghiệp vụ

1. Đọc docs/ARCHITECTURE.md: Mục 5 (Household), 6 (Matching), 7 (AI), 14 (quyết định). Đó là NGUỒN DUY NHẤT về luật.
2. Điểm chỉ được ghi trong `approve_task` (chỉ cron/service gọi). Không bao giờ UPDATE/DELETE `point_ledger`.
3. Client không đổi `task_instances.status` trực tiếp; luôn gọi RPC (`claim_task`, `submit_task`, `dispute_task`…).
4. Tuần & "hôm nay" theo giờ VN: dùng `vn_week_start()`; DB/cron chạy UTC.
5. Ẩn danh: không bao giờ đưa `requester_id`, `raised_by`, hay free-text dispute vào bất kỳ response/thông báo cho member.
6. Nếu yêu cầu cần một luật không có trong ARCHITECTURE Mục 5–7/14: DỪNG, nêu câu hỏi cụ thể cho người dùng. Không đoán.
7. Khi thay đổi hằng số/luật: cập nhật ARCHITECTURE (Mục 5.1/14) trong cùng PR.
