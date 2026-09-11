-- Phase 3: Match Engine — score a job against the Career Profile with an
-- inspectable, evidence-traced breakdown. Nothing consumes this yet (no
-- Resume Engine, Truth Guard, or Application Tracker integration).

create table public.job_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null unique references public.jobs(id) on delete cascade,
  required_skills_score numeric not null check (required_skills_score between 0 and 1),
  preferred_skills_score numeric not null check (preferred_skills_score between 0 and 1),
  relevant_experience_score numeric not null check (relevant_experience_score between 0 and 1),
  seniority_score numeric check (seniority_score between 0 and 1),
  industry_domain_score numeric not null check (industry_domain_score between 0 and 1),
  resume_representation_score numeric check (resume_representation_score between 0 and 1),
  overall_score numeric not null check (overall_score between 0 and 1),
  recommendation text not null check (recommendation in ('apply', 'apply_stretch', 'maybe', 'skip')),
  created_at timestamptz not null default now()
);

create table public.job_score_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_score_id uuid not null references public.job_scores(id) on delete cascade,
  requirement_text text not null,
  requirement_type text not null check (requirement_type in ('required', 'preferred', 'technology', 'domain')),
  status text not null check (status in ('strong', 'partial', 'missing')),
  matched_skill_id uuid references public.skills(id) on delete cascade,
  matched_experience_id uuid references public.experiences(id) on delete cascade,
  matched_accomplishment_id uuid references public.accomplishments(id) on delete cascade,
  matched_evidence_id uuid references public.evidence(id) on delete cascade,
  rationale text not null,
  created_at timestamptz not null default now(),
  check (
    (status = 'missing' and matched_skill_id is null and matched_experience_id is null
      and matched_accomplishment_id is null and matched_evidence_id is null)
    or
    (status <> 'missing' and (
      (matched_skill_id is not null)::int + (matched_experience_id is not null)::int +
      (matched_accomplishment_id is not null)::int + (matched_evidence_id is not null)::int
    ) = 1)
  )
);

alter table public.job_scores enable row level security;
alter table public.job_score_matches enable row level security;

create policy "individuals manage own job scores" on public.job_scores
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "individuals manage own job score matches" on public.job_score_matches
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
