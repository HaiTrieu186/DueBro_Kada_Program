-- Migration 006: Anonymity Shield (DueBro Architecture Section 4.6)

create table notifications_log (
  id bigint generated always as identity primary key,
  room_id uuid not null references rooms(id),
  recipient_id uuid not null references profiles(id),
  task_id uuid references task_instances(id),
  level escalation_level,
  message text not null,
  sent_at timestamptz not null default now()
);

-- Nhắc nhẹ ẩn danh — bảng gốc KHÔNG bao giờ SELECT được bởi client,
-- chỉ Edge Function (service role) đọc requester_id.
create table nudge_requests (
  id bigint generated always as identity primary key,
  room_id uuid not null references rooms(id),
  task_id uuid not null references task_instances(id),
  requester_id uuid not null references profiles(id),  -- ẩn danh với member khác
  created_at timestamptz not null default now()
);

-- Dispute — CÙNG cơ chế ẩn danh như nudge
create table disputes (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references task_instances(id) on delete cascade,
  room_id uuid not null references rooms(id),
  raised_by uuid not null references profiles(id),  -- ẩn danh với member thường, chỉ admin/service_role đọc được
  reason text,
  status text not null default 'open',   -- 'open' | 'resolved'
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- View public cho mobile client — KHÔNG có raised_by
create view disputes_public as
  select id, task_id, room_id, status, created_at, resolved_at from disputes;
