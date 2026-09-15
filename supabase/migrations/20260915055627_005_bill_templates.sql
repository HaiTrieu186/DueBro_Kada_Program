-- Migration 005: Bill Templates (DueBro Architecture Section 4.5)

create table bill_templates (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  name text not null,
  recurrence_rule text not null,
  created_by uuid not null references profiles(id),
  is_active boolean not null default true
);
-- Bill instance tái dùng task_instances với source='life_deadline' — không tách bảng riêng
