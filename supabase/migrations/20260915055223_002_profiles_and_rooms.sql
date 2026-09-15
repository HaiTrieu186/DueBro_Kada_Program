-- Migration 002: Profiles & Rooms (DueBro Architecture Section 4.2)

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  push_token text,
  locale text default 'vi',
  created_at timestamptz not null default now()
);

create table rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null,
  mascot_name text default 'Bro',
  is_pro boolean not null default false,
  max_members int not null default 4,
  reward_contract_text text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table room_members (
  room_id uuid not null references rooms(id) on delete cascade,
  member_id uuid not null references profiles(id) on delete cascade,
  role member_role not null default 'member',
  away_status away_status not null default 'active',
  away_from date,
  away_to date,
  joined_at timestamptz not null default now(),
  is_new_member_until timestamptz,
  karma_score numeric not null default 0,
  left_at timestamptz,  -- soft-delete, giữ lịch sử đóng góp
  primary key (room_id, member_id)
);
create index idx_room_members_room on room_members(room_id) where left_at is null;
