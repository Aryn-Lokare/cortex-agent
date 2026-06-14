-- Create the Brand Profiles table
create table if not exists public.brand_profiles (
  user_id uuid references auth.users(id) on delete cascade primary key,
  user_name text not null,
  brand_name text not null,
  brand_description text not null,
  brand_voice text not null,
  tone_preferences text not null,
  writing_style_parameters text not null,
  content_constraints text not null,
  connected_accounts jsonb default '[]'::jsonb not null,
  oauth_tokens jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.brand_profiles enable row level security;

-- Create Policies
create policy "Users manage own brand_profile" on public.brand_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Create updated_at trigger
create trigger set_updated_at_brand_profiles
  before update on public.brand_profiles
  for each row execute function public.handle_updated_at();
