-- Phase 1: Career Profile — verified source of truth for professional experience.
-- Not consumed by anything yet (no Job Analyzer, Match Engine, Resume Engine, Truth Guard).

create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  problem text not null,
  action text not null,
  result text not null,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  title text not null,
  location text,
  start_date date not null,
  end_date date,
  description text,
  technologies text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  url text,
  technologies text[] not null default '{}',
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  evidence_strength text not null default 'none'
    check (evidence_strength in ('direct', 'adjacent', 'limited', 'none')),
  evidence_id uuid references public.evidence(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name),
  check (evidence_strength <> 'direct' or evidence_id is not null)
);

create table public.accomplishments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  experience_id uuid references public.experiences(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  description text not null,
  evidence_id uuid references public.evidence(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((experience_id is not null) <> (project_id is not null))
);

alter table public.evidence enable row level security;
alter table public.experiences enable row level security;
alter table public.projects enable row level security;
alter table public.skills enable row level security;
alter table public.accomplishments enable row level security;

create policy "individuals manage own evidence" on public.evidence
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "individuals manage own experiences" on public.experiences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "individuals manage own projects" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "individuals manage own skills" on public.skills
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "individuals manage own accomplishments" on public.accomplishments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
