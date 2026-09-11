-- Phase 4: Resume Engine — tailored, code-templated, AI-content-filled
-- resumes. Every claim traces to a real Career Profile row (CLAUDE.md's
-- non-negotiable rule). No resume_templates table: there is exactly one
-- hardcoded ATS-safe template (lib/resume/template.ts) — a DB table for a
-- single, non-user-specific formatting config would be pure ceremony.

create table public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete cascade, -- null = Master Resume
  based_on_version_id uuid references public.resume_versions(id) on delete set null,
  label text not null,
  version_number integer not null,
  created_at timestamptz not null default now()
);

create table public.resume_sections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_version_id uuid not null references public.resume_versions(id) on delete cascade,
  order_index integer not null,
  section_type text not null check (section_type in (
    'summary_claim', 'skill', 'experience_header', 'experience_bullet',
    'project_header', 'project_bullet'
  )),
  content_text text not null,
  matched_experience_id uuid references public.experiences(id) on delete cascade,
  matched_project_id uuid references public.projects(id) on delete cascade,
  matched_accomplishment_id uuid references public.accomplishments(id) on delete cascade,
  matched_evidence_id uuid references public.evidence(id) on delete cascade,
  matched_skill_id uuid references public.skills(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (
    (matched_experience_id is not null)::int + (matched_project_id is not null)::int +
    (matched_accomplishment_id is not null)::int + (matched_evidence_id is not null)::int +
    (matched_skill_id is not null)::int = 1
  )
);

alter table public.resume_versions enable row level security;
alter table public.resume_sections enable row level security;

create policy "individuals manage own resume versions" on public.resume_versions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "individuals manage own resume sections" on public.resume_sections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
