-- ============================================================
-- CORTEX AGENT HITL PIPELINE SCHEMA
-- Run this in Supabase SQL Editor.
-- ============================================================

-- 1. Pipeline Runs
create table if not exists public.pipeline_runs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  session_id uuid references public.chat_sessions(id) on delete set null,
  user_message text not null,
  status text not null default 'running' check (status in ('running', 'awaiting_review', 'completed', 'failed')),
  current_step text not null default 'strategy' check (current_step in ('strategy', 'writing', 'creation', 'posting')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 2. Pipeline Steps (Per-Agent Outputs)
create table if not exists public.pipeline_steps (
  id uuid default gen_random_uuid() primary key,
  run_id uuid references public.pipeline_runs(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  agent text not null check (agent in ('strategy', 'writing', 'creation', 'posting')),
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'awaiting_review', 'approved', 'rejected', 'skipped')),
  input_data jsonb,
  output_data jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_pipeline_runs_user on public.pipeline_runs(user_id, updated_at desc);
create index if not exists idx_pipeline_steps_run on public.pipeline_steps(run_id, created_at asc);
create index if not exists idx_pipeline_steps_user on public.pipeline_steps(user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.pipeline_runs enable row level security;
alter table public.pipeline_steps enable row level security;

create policy "Users manage own pipeline_runs" on public.pipeline_runs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own pipeline_steps" on public.pipeline_steps
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- AUTO-UPDATE TRIGGER
-- ============================================================
create trigger set_updated_at_pipeline_runs
  before update on public.pipeline_runs
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_pipeline_steps
  before update on public.pipeline_steps
  for each row execute function public.handle_updated_at();

-- ============================================================
-- ENABLE REALTIME
-- ============================================================
alter publication supabase_realtime add table public.pipeline_runs;
alter publication supabase_realtime add table public.pipeline_steps;
