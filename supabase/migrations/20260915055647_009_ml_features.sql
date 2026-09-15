-- Migration 009: ML Features & Predictions (DueBro Architecture Section 4.9)

create materialized view mv_member_features as
select
  rm.member_id, rm.room_id,
  coalesce(wqp.achieved_points, 0)::float / nullif(wqt.target_points, 0) as quota_progress_pct,
  avg(case when te.event_type = 'completed' then 1 else 0 end) as completion_rate,
  avg(extract(epoch from (ti.approved_at - ti.due_at)) / 3600)
    filter (where ti.approved_at > ti.due_at) as avg_delay_hours,
  (select sum(amount) from point_ledger pl
     where pl.member_id = rm.member_id and pl.point_type = 'karma_permanent') as total_karma,
  rm.away_status,
  rm.is_new_member_until,
  extract(day from now() - rm.joined_at) as tenure_days
from room_members rm
left join weekly_quota_progress wqp on wqp.room_id = rm.room_id and wqp.member_id = rm.member_id
left join weekly_quota_targets wqt on wqt.room_id = rm.room_id and wqt.member_id = rm.member_id and wqt.week_start = wqp.week_start
left join task_instances ti on ti.claimed_by = rm.member_id
left join task_events te on te.task_id = ti.id
where rm.left_at is null
group by rm.member_id, rm.room_id, wqp.achieved_points, wqt.target_points, rm.away_status, rm.is_new_member_until, rm.joined_at;

create unique index idx_mv_member_features on mv_member_features (room_id, member_id);

-- Log mọi lần ML/rule-based đưa ra ranking, dùng để đánh giá & audit
create table ml_predictions (
  id bigint generated always as identity primary key,
  task_id uuid not null references task_instances(id),
  candidate_member_id uuid not null references profiles(id),
  score numeric not null,
  rank int not null,
  model_version text not null,   -- 'rule_v1' hoặc 'lgbm_YYYYMMDD'
  created_at timestamptz not null default now()
);
