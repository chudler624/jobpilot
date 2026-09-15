-- Phase 7.5: Adzuna discovery source — a second, keyword-searchable
-- source alongside Greenhouse's per-company board watching (ADR-016).
--
-- Dedup is unified onto (user_id, source, external_id) for BOTH sources
-- (Greenhouse's list API also returns a stable numeric id per job,
-- previously uncaptured). The old source_url-based partial index from
-- migration 0008 is kept, not dropped: pre-migration Greenhouse rows have
-- no external_id yet, so both indexes stay active as belt-and-suspenders
-- — a row is rejected on a duplicate source_url OR a duplicate
-- (source, external_id), whichever applies. No backfill needed.

alter table public.jobs
  add column external_id text,
  add column is_snippet_only boolean not null default false;

alter table public.jobs drop constraint jobs_source_check;
alter table public.jobs add constraint jobs_source_check
  check (source in ('greenhouse', 'adzuna'));

create unique index jobs_user_source_external_id_key on public.jobs (user_id, source, external_id)
  where source is not null and external_id is not null;
