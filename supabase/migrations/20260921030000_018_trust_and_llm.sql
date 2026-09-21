-- ===== 018_trust_and_llm.sql (AI sở hữu) =====
-- Architecture Section 4.5: Trust Score v1 (Bayesian) & LLM usage log

create index if not exists idx_task_claimed_by on task_instances (claimed_by) where claimed_by is not null;

-- Trust Score v1 — tính TRỰC TIẾP (không dùng materialized view) để demo thấy điểm đổi ngay sau khi approve.
-- Công thức: Bayesian shrinkage, prior 0.70 với trọng số 5 "việc ảo" → người mới không bị 0 hay 100 oan.
--   score = clamp( round(100 * (on_time + 3.5) / (resolved + 5)) - least(10, 2 * dispute_cnt), 0, 100 )
--   resolved = completed + expired ; on_time = completed và nộp trước/đúng due_at
-- Nhãn: resolved < 5 → 'new' (provisional) | score >= 85 'gold' | >= 70 'silver' | còn lại 'bronze'
create or replace function get_user_trust(p_user_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_me uuid := auth.uid();
  v_completed int; v_expired int; v_ontime int; v_dispute int; v_resolved int;
  v_score int; v_level text; v_seed record;
begin
  if v_me is null then raise exception 'Chưa đăng nhập'; end if;
  -- Quyền xem: chính mình | cùng phòng | có trong danh sách gợi ý của mình | cùng kết nối | ops
  if not (
    p_user_id = v_me
    or exists (select 1 from room_members a join room_members b on a.room_id = b.room_id
               where a.member_id = v_me and b.member_id = p_user_id and a.left_at is null and b.left_at is null)
    or exists (select 1 from match_suggestions where user_id = v_me and candidate_id = p_user_id)
    or exists (select 1 from match_connections where (user_a_id = v_me and user_b_id = p_user_id) or (user_b_id = v_me and user_a_id = p_user_id))
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'ops', false)
  ) then
    raise exception 'Không có quyền xem điểm tin cậy của người này';
  end if;

  select is_seed_data, seed_trust_score into v_seed from lifestyle_profiles where user_id = p_user_id;
  if v_seed.is_seed_data and v_seed.seed_trust_score is not null then
    return jsonb_build_object('score', v_seed.seed_trust_score, 'level',
      case when v_seed.seed_trust_score >= 85 then 'gold' when v_seed.seed_trust_score >= 70 then 'silver' else 'bronze' end,
      'resolved_count', 12, 'on_time_rate', null, 'dispute_count', 0, 'is_provisional', false, 'is_simulated', true);
  end if;

  select count(*) filter (where status = 'completed'),
         count(*) filter (where status = 'expired'),
         count(*) filter (where status = 'completed' and submitted_at <= due_at)
    into v_completed, v_expired, v_ontime
  from task_instances where claimed_by = p_user_id;

  select count(*) into v_dispute
  from disputes d join task_instances ti on ti.id = d.task_id where ti.claimed_by = p_user_id;

  v_resolved := v_completed + v_expired;
  v_score := greatest(0, least(100,
      round(100.0 * (v_ontime + 3.5) / (v_resolved + 5))::int - least(10, 2 * v_dispute)));
  v_level := case when v_resolved < 5 then 'new' when v_score >= 85 then 'gold' when v_score >= 70 then 'silver' else 'bronze' end;

  return jsonb_build_object('score', v_score, 'level', v_level, 'resolved_count', v_resolved,
    'on_time_rate', case when v_resolved > 0 then round(v_ontime::numeric / v_resolved, 2) end,
    'dispute_count', v_dispute, 'is_provisional', v_resolved < 5, 'is_simulated', false);
end;
$$;
revoke execute on function get_user_trust(uuid) from public, anon;
grant execute on function get_user_trust(uuid) to authenticated;

create table if not exists llm_usage_log (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete set null,
  purpose text not null check (purpose in ('bro_message', 'match_reason', 'seed_reply', 'other')),
  model text not null,
  input_tokens int, output_tokens int, latency_ms int,
  fallback_used boolean not null default false,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists idx_llm_usage_user_day on llm_usage_log (user_id, created_at desc);

alter table llm_usage_log enable row level security;   -- KHÔNG policy → chỉ service_role / ops đọc
revoke all on llm_usage_log from anon, authenticated;
grant select on llm_usage_log to service_role;
