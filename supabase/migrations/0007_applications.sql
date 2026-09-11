-- Phase 6: Application Tracker — ties Job Analyzer, Match Engine, and
-- Resume Engine together into a single trackable record, plus the
-- supporting contacts/interviews/follow_ups detail tables.
--
-- job_id is `on delete restrict`, unlike resume_versions/job_scores which
-- cascade on job deletion — those cascade because their data is
-- regeneratable from the job; an application is irreplaceable personal
-- history and must never be silently destroyed by a job cleanup.
--
-- resume_version_id is `on delete set null`: deleting a resume version
-- already requires explicit confirmation in the UI, so losing the
-- reference on an already-confirmed deletion is acceptable — the
-- application record itself must not be endangered by a resume cleanup.
--
-- match_score_at_creation is a deliberate one-time snapshot, not a FK:
-- job_scores.job_id is unique and re-analysis deletes-then-inserts the
-- row (no history), so a live join would be unreliable for later
-- analytics (Phase 9) if the score changes or the job_scores row is gone
-- by the time it's read.

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete restrict,
  resume_version_id uuid references public.resume_versions(id) on delete set null,
  status text not null default 'discovered' check (status in (
    'discovered', 'qualified', 'resume_generated', 'ready', 'applied',
    'recruiter_screen', 'interview', 'final', 'offer', 'rejected', 'ghosted'
  )),
  status_updated_at timestamptz not null default now(),
  match_score_at_creation numeric check (match_score_at_creation between 0 and 1),
  salary_notes text,
  cover_letter_text text,
  why_tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, job_id)
);

-- One row per status transition — the audit trail applications.status
-- can't provide on its own (it only ever remembers the latest change).
create table public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  status text not null check (status in (
    'discovered', 'qualified', 'resume_generated', 'ready', 'applied',
    'recruiter_screen', 'interview', 'final', 'offer', 'rejected', 'ghosted'
  )),
  note text,
  changed_at timestamptz not null default now()
);

-- application_id is nullable: a contact (recruiter) can span multiple
-- applications at the same company over time, or exist before any
-- specific application does.
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  name text not null,
  role text,
  email text,
  phone text,
  linkedin_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  interview_type text,
  scheduled_at timestamptz,
  notes text,
  outcome text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  note text not null,
  due_date date,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.applications enable row level security;
alter table public.application_status_history enable row level security;
alter table public.contacts enable row level security;
alter table public.interviews enable row level security;
alter table public.follow_ups enable row level security;

create policy "individuals manage own applications" on public.applications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "individuals manage own application status history" on public.application_status_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "individuals manage own contacts" on public.contacts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "individuals manage own interviews" on public.interviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "individuals manage own follow ups" on public.follow_ups
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
