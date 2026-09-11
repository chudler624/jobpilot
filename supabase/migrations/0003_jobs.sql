-- Phase 2: Job Analyzer — structured, stored data extracted from a pasted
-- job description or URL. Nothing consumes this yet (no Match Engine,
-- Resume Engine, or Truth Guard).

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_url text,
  raw_description text not null,
  company text,
  title text,
  location text,
  workplace_type text check (workplace_type in ('remote', 'hybrid', 'onsite')),
  salary_min integer,
  salary_max integer,
  salary_currency text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (salary_min is null or salary_max is null or salary_max >= salary_min)
);

create table public.job_requirements (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references public.jobs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  responsibilities text[] not null default '{}',
  required_qualifications text[] not null default '{}',
  preferred_qualifications text[] not null default '{}',
  technologies text[] not null default '{}',
  experience_requirement text,
  education_requirement text,
  keywords text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.jobs enable row level security;
alter table public.job_requirements enable row level security;

create policy "individuals manage own jobs" on public.jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "individuals manage own job requirements" on public.job_requirements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
