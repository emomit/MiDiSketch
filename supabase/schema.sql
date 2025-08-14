-- Enable required extensions
create extension if not exists pgcrypto;

-- Projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  data jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.projects enable row level security;

create policy "projects_select_own" on public.projects
  for select using (auth.uid() = user_id);

create policy "projects_modify_own" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Project versions (backups)
create table if not exists public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  data jsonb not null
);

alter table public.project_versions enable row level security;

create policy "versions_select_own" on public.project_versions
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_versions.project_id and p.user_id = auth.uid()
    )
  );

create policy "versions_insert_own" on public.project_versions
  for insert with check (
    exists (
      select 1 from public.projects p
      where p.id = project_versions.project_id and p.user_id = auth.uid()
    )
  );

-- User settings
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'dark',
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "settings_select_own" on public.user_settings
  for select using (auth.uid() = user_id);

create policy "settings_upsert_own" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

