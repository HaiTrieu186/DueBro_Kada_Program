-- Migration 007: Swap / SOS (DueBro Architecture Section 4.7)

create table swap_requests (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references task_instances(id),
  requested_by uuid not null references profiles(id),
  accepted_by uuid references profiles(id),
  status text not null default 'open',  -- open | accepted | cancelled
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);
