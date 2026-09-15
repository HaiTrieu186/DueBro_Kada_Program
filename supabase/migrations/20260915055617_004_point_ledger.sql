-- Migration 004: Point Ledger & Economy (DueBro Architecture Section 4.4)

create table point_ledger (
  id bigint generated always as identity primary key,
  room_id uuid not null references rooms(id),
  member_id uuid not null references profiles(id),
  point_type point_type not null,
  reason point_reason not null,
  amount numeric not null,           -- có thể âm (penalty, redemption)
  task_id uuid references task_instances(id),
  week_start date,                   -- chỉ set cho effort_weekly
  created_at timestamptz not null default now()
);
create index idx_ledger_room_member_week on point_ledger(room_id, member_id, week_start) where point_type = 'effort_weekly';

create view weekly_quota_progress as
select room_id, member_id, week_start, sum(amount) as achieved_points
from point_ledger
where point_type = 'effort_weekly'
group by room_id, member_id, week_start;

create table weekly_quota_targets (
  room_id uuid not null references rooms(id),
  member_id uuid not null references profiles(id),
  week_start date not null,
  target_points int not null,   -- mặc định 60, giảm 50% nếu is_new_member_until còn hiệu lực
  primary key (room_id, member_id, week_start)
);

create table karma_redemptions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references profiles(id),
  reward_type text not null,     -- 'skip_next_task', ...
  karma_cost numeric not null,
  redeemed_at timestamptz not null default now(),
  used_at timestamptz
);
