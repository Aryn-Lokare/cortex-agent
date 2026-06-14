-- ============================================================
-- CORTEX FEATURE SCHEMAS (CAMPAIGNS, POSTS, ANALYTICS)
-- ============================================================

-- 1. Campaigns
create table if not exists public.campaigns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  goal text not null,
  audience text not null,
  start_date date,
  end_date date,
  status text not null default 'planning' check (status in ('planning', 'active', 'completed')),
  progress integer default 0 check (progress >= 0 and progress <= 100),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS & Policies for Campaigns
alter table public.campaigns enable row level security;

create policy "Users manage own campaigns" on public.campaigns
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger set_updated_at_campaigns
  before update on public.campaigns
  for each row execute function public.handle_updated_at();

-- 2. Posts (Content Library / Calendar Scheduler)
create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  title text,
  content text not null,
  platform text not null check (platform in ('twitter', 'linkedin', 'instagram')),
  status text not null default 'draft' check (status in ('draft', 'approved', 'scheduled', 'published')),
  scheduled_at timestamptz,
  published_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS & Policies for Posts
alter table public.posts enable row level security;

create policy "Users manage own posts" on public.posts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger set_updated_at_posts
  before update on public.posts
  for each row execute function public.handle_updated_at();

-- 3. Analytics Snapshots
create table if not exists public.analytics_snapshots (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  platform text not null check (platform in ('all', 'twitter', 'linkedin', 'instagram')),
  metric_date date not null,
  followers_count integer default 0,
  engagement_rate numeric(5,2) default 0.00,
  impressions_count integer default 0,
  clicks_count integer default 0,
  created_at timestamptz default now() not null,
  constraint unique_user_platform_date unique (user_id, platform, metric_date)
);

-- Enable RLS & Policies for Analytics
alter table public.analytics_snapshots enable row level security;

create policy "Users manage own analytics" on public.analytics_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Enable Realtime
alter publication supabase_realtime add table public.campaigns;
alter publication supabase_realtime add table public.posts;
