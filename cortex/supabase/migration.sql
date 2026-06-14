-- ============================================================
-- CORTEX DASHBOARD SCHEMA
-- Run this in Supabase SQL Editor before starting the app.
-- ============================================================

-- 1. Chat Sessions
create table if not exists public.chat_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'New conversation',
  last_message_preview text,
  message_count integer default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 2. Chat Messages
create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.chat_sessions(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now() not null
);

-- 3. Agent Tasks (active work)
create table if not exists public.agent_tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  agent text not null check (agent in ('orchestrator', 'strategy', 'writing', 'creation', 'posting', 'hindsight')),
  status text not null default 'queued' check (status in ('queued', 'in_progress', 'completing', 'completed', 'failed')),
  progress integer default 0 check (progress >= 0 and progress <= 100),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 4. Approval Queue
create table if not exists public.approval_queue (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  content_preview text not null,
  content_full text,
  platform text not null check (platform in ('twitter', 'linkedin', 'instagram')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now() not null,
  reviewed_at timestamptz
);

-- 5. Learnings (Hindsight)
create table if not exists public.learnings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  insight text not null,
  type text not null check (type in ('writing_preference', 'audience_insight', 'tone_adjustment', 'content_pattern')),
  confidence numeric(3,2) default 0.50 check (confidence >= 0 and confidence <= 1),
  source text not null default 'system',
  created_at timestamptz default now() not null
);

-- 6. Agent Activity (real-time status)
create table if not exists public.agent_activity (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  agent text not null check (agent in ('orchestrator', 'strategy', 'writing', 'creation', 'posting', 'hindsight')),
  status text not null default 'idle' check (status in ('active', 'idle', 'waiting')),
  current_task text,
  last_active_at timestamptz default now() not null,
  constraint unique_user_agent unique (user_id, agent)
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_chat_sessions_user on public.chat_sessions(user_id, updated_at desc);
create index if not exists idx_chat_messages_session on public.chat_messages(session_id, created_at asc);
create index if not exists idx_agent_tasks_user on public.agent_tasks(user_id, status, updated_at desc);
create index if not exists idx_approval_queue_user on public.approval_queue(user_id, status, created_at desc);
create index if not exists idx_learnings_user on public.learnings(user_id, created_at desc);
create index if not exists idx_agent_activity_user on public.agent_activity(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.agent_tasks enable row level security;
alter table public.approval_queue enable row level security;
alter table public.learnings enable row level security;
alter table public.agent_activity enable row level security;

create policy "Users manage own chat_sessions" on public.chat_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own chat_messages" on public.chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own agent_tasks" on public.agent_tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own approval_queue" on public.approval_queue
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own learnings" on public.learnings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own agent_activity" on public.agent_activity
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_chat_sessions
  before update on public.chat_sessions
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_agent_tasks
  before update on public.agent_tasks
  for each row execute function public.handle_updated_at();

-- ============================================================
-- INITIALIZE AGENT ACTIVITY ROWS
-- Called after user's first dashboard visit to seed 6 agent rows
-- ============================================================
create or replace function public.initialize_agent_activity(p_user_id uuid)
returns void as $$
begin
  insert into public.agent_activity (user_id, agent, status, current_task)
  values
    (p_user_id, 'orchestrator', 'idle', null),
    (p_user_id, 'strategy', 'idle', null),
    (p_user_id, 'writing', 'idle', null),
    (p_user_id, 'creation', 'idle', null),
    (p_user_id, 'posting', 'idle', null),
    (p_user_id, 'hindsight', 'idle', null)
  on conflict (user_id, agent) do nothing;
end;
$$ language plpgsql security definer;

-- ============================================================
-- ENABLE REALTIME
-- ============================================================
alter publication supabase_realtime add table public.agent_activity;
alter publication supabase_realtime add table public.agent_tasks;
alter publication supabase_realtime add table public.approval_queue;
alter publication supabase_realtime add table public.chat_sessions;
