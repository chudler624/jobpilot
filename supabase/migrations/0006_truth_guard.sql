-- Phase 5: Truth Guard — a mandatory human-confirmation gate on top of
-- Phase 4's existing, unconditional citation guarantee (DB foreign keys +
-- findFabricatedResumeCitation already make a fabricated citation
-- impossible to persist). Phase 5 adds: per-claim human verification, and
-- a draft/finalized milestone that requires 100% of claims verified.
--
-- Confidence (well-evidenced vs. thin) is deliberately NOT a stored
-- column — it's computed on read from the cited row's live evidence_strength
-- / verified data (same rule as scoreResumeRepresentation in
-- lib/match/score.ts), so it never goes stale if the user edits their
-- Career Profile after a resume was generated.

alter table public.resume_sections
  add column user_verified boolean not null default false,
  add column verified_at timestamptz;

alter table public.resume_versions
  add column status text not null default 'draft' check (status in ('draft', 'finalized')),
  add column finalized_at timestamptz;
