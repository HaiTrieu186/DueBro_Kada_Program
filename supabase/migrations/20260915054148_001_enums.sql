-- Migration 001: Enums (DueBro Architecture Section 4.1)

create type member_role as enum ('host', 'member');
create type task_source as enum ('recurring', 'adhoc', 'life_deadline');
create type task_status as enum (
  'open', 'claimed', 'assigned', 'pending_approval',
  'disputed', 'completed', 'expired'
);
create type escalation_level as enum ('friendly', 'due', 'sarcastic', 'sos');
create type point_type as enum ('effort_weekly', 'karma_permanent');
create type point_reason as enum (
  'task_base', 'volunteer_bonus', 'sos_rescue_bonus', 'swap_karma_bonus',
  'weekly_reset', 'manual_adjustment', 'penalty'
);
create type away_status as enum ('active', 'away');
