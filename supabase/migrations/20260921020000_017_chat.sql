-- ===== 017_chat.sql (App Core sở hữu) =====
-- Architecture Section 4.4: Realtime Chat between matched users

create table if not exists messages (
  id bigint generated always as identity primary key,
  connection_id uuid not null references match_connections(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_conn_time on messages (connection_id, created_at desc);

alter table messages enable row level security;

drop policy if exists "msg_select_member" on messages;
create policy "msg_select_member" on messages for select to authenticated
  using (is_connection_member(connection_id));

drop policy if exists "msg_insert_own" on messages;
create policy "msg_insert_own" on messages for insert to authenticated
  with check (sender_id = auth.uid() and is_connection_member(connection_id));

-- Không ai được sửa hoặc xóa tin nhắn
revoke update, delete on messages from anon, authenticated;
revoke insert on messages from anon;

-- Thêm vào Realtime publication (nếu có publication supabase_realtime)
do $$
begin
  alter publication supabase_realtime add table messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
