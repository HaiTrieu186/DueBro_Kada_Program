# Supabase Edge Functions (Deno / TypeScript)

Thư mục chứa các Edge Functions xử lý tác vụ nền và webhook (Mục 8 Solution Architecture):
- `generate-recurring-tasks` (cron 00:05)
- `escalate-reminders` (cron mỗi 5p)
- `auto-assign-task` (cron mỗi 15p)
- `reset-weekly-quota` (cron Thứ Hai 00:00)
- `revenuecat-webhook` (IAP payment sync)
- `send-push` (helper gọi Expo Push API)
