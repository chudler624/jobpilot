-- Jobicy discovery source: a keyword-searchable public API (full posting
-- text, remote roles) searched alongside Adzuna from the one Discover form.
-- Only the source check constraint changes; dedup reuses the existing
-- (user_id, source, external_id) index from migration 0011.

alter table public.jobs drop constraint jobs_source_check;
alter table public.jobs add constraint jobs_source_check
  check (source in ('greenhouse', 'adzuna', 'jobicy'));
