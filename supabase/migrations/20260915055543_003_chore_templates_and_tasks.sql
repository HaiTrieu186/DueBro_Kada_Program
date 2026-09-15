-- Migration 003: Chores & Tasks (DueBro Architecture Section 4.3)

create table chore_templates (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  name text not null,
  category text not null,
  default_effort_points int not null,
  estimated_minutes int,
  recurrence_rule text,               -- iCal RRULE
  requires_photo boolean not null default false,  -- true nếu effort_points >= 30 (BRD 3.2)
  is_active boolean not null default true,
  created_by uuid not null references profiles(id),
  approved_by_host boolean not null default true,
  created_at timestamptz not null default now()
);

create table task_instances (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  template_id uuid references chore_templates(id),
  source task_source not null,
  title text not null,
  category text,
  effort_points int not null,
  requires_photo boolean not null default false,
  status task_status not null default 'open',
  due_at timestamptz not null,
  opened_at timestamptz not null default now(),
  claimed_by uuid references profiles(id),
  claimed_at timestamptz,
  assignment_method text,             -- 'volunteer' | 'auto_round_robin' | 'auto_ml' | 'sos_swap'
  submitted_at timestamptz,
  approved_at timestamptz,
  last_escalation_level escalation_level,
  bonus_multiplier numeric not null default 1.0,
  original_owner_id uuid references profiles(id),  -- swap: chủ gốc
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index idx_task_room_status on task_instances(room_id, status);
create index idx_task_due on task_instances(due_at) where status in ('open','claimed','assigned');

-- Event log append-only — audit + dữ liệu train ML
create table task_events (
  id bigint generated always as identity primary key,
  task_id uuid not null references task_instances(id) on delete cascade,
  event_type text not null,  -- 'created','claimed','auto_assigned','escalation_sent','submitted','approved','disputed','completed','expired','swapped'
  actor_id uuid references profiles(id),
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table task_photos (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references task_instances(id) on delete cascade,
  storage_path text not null,
  uploaded_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);
