-- Phase 7: Job Discovery — pulls jobs in from watched companies' public
-- Greenhouse job boards instead of one-at-a-time paste (ADR-009: no
-- LinkedIn/Indeed scraping; Greenhouse's public board API is explicitly
-- designed for external consumption, unlike those two).

create table public.watched_companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  ats text not null default 'greenhouse' check (ats in ('greenhouse')),
  board_token text not null,
  created_at timestamptz not null default now(),
  unique (user_id, board_token)
);

alter table public.watched_companies enable row level security;
create policy "individuals manage own watched companies" on public.watched_companies
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- null = manually pasted/URL (existing Job Analyzer flow, unchanged)
alter table public.jobs add column source text check (source in ('greenhouse'));

-- Dedup key for discovery-sourced jobs: Greenhouse always provides a real
-- absolute_url per posting, so source_url alone is enough (no fuzzy
-- fallback needed). Partial index because paste-text jobs have no URL.
create unique index jobs_user_source_url_key on public.jobs (user_id, source_url)
  where source_url is not null;
