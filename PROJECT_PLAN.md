# AI JOB SEARCH OS

## Current Status

Phase: 7 / 10
Progress: 70% (Phases 0-7 of 10 complete)

Current Goal:
Manually load and live-test Phase 8 — Application Assistant (browser
extension) — see extension/README.md. This is the first phase I
genuinely cannot verify myself (no way to drive a real browser from
here), so it needs a manual pass before it can be marked done.

---

## Roadmap

- [x] Phase 0 — Foundation
- [x] Phase 1 — Career Profile
- [x] Phase 1.5 — Career Profile Import (added mid-Phase-4 planning, not in the original 0-10 roadmap)
- [x] Phase 2 — Job Analyzer
- [x] Phase 3 — Match Engine
- [x] Phase 4 — Resume Engine
- [x] Phase 5 — Truth Guard
- [x] Phase 6 — Application Tracker
- [x] Phase 7 — Job Discovery
- [ ] Phase 7.5 — Job Discovery: Adzuna source (added post-Phase-8, directly addressing Phase 7 user feedback, not in the original 0-10 roadmap)
- [ ] Phase 8 — Application Assistant
- [ ] Phase 9 — Analytics
- [ ] Phase 10 — Monetization

## Do Not Build Yet
- Stripe / billing
- Browser extension / autofill
- Automated application submission
- Job scraping / discovery
- Multi-user-facing functionality (teams, orgs, admin)
- Advanced analytics

---

## Phase 0 — Foundation

**Status:** DONE

### Objective
Get a bare-bones app deployed and connected to the database.

### Build
- Next.js + TypeScript project
- Tailwind + shadcn/ui
- Supabase project (DB + Auth + Storage)
- GitHub repo
- Vercel deployment
- Environment variables wired up
- Basic dashboard shell + nav
- Auth (sign in / sign out)

### Acceptance Criteria
- [x] `https://<project>.vercel.app` loads (https://jobpilot-sandy.vercel.app)
- [x] Can sign in via Supabase Auth (verified locally and in production —
      confirmed live during Phase 1 testing on jobpilot-sandy.vercel.app)
- [x] Dashboard shell renders with nav (Dashboard, Jobs, Applications, Resume, Career Profile, Analytics, Settings)
- [x] Supabase connection verified (a trivial read/write works)
- [x] Lint, typecheck, and build all pass

---

## Phase 1 — Career Profile

**Status:** DONE

### Objective
Create the verified source of truth for your professional experience — the data everything else pulls from.

### Features
- Experience editor (company, role, dates, technologies)
- Accomplishments (linked to an experience, with evidence)
- Skills (with evidence-strength: Direct / Adjacent / Limited / None)
- Projects (personal/technical, separate from professional experience)
- Evidence bank entries (problem, what I did, result, verified y/n)

### Database
- `experiences`
- `accomplishments`
- `skills`
- `projects`
- `evidence`

### Acceptance Criteria
- [x] Can create/edit/delete an experience
- [x] Can add skills with evidence-strength tagging
- [x] Can associate evidence with an accomplishment
- [x] Data persists in Supabase, scoped to the user
- [x] Build passes

---

## Phase 1.5 — Career Profile Import

**Status:** DONE (DOCX path verified live; PDF path shares the same code
path and was verified for extraction quality via a standalone script, but
not yet exercised through the actual upload UI — low risk, worth a quick
live check next time a PDF resume is handy)

Added mid-Phase-4-planning, not part of the original Phase 0-10 roadmap —
requested to give Match Engine (Phase 3) and Resume Engine (Phase 4)
realistic data to be tested against instead of sparse manually-entered
test rows. Architecturally a Career Profile (Phase 1) concern: it only
populates `experiences`/`accomplishments`/`skills`/`projects` and touches
none of Phase 4's resume-generation tables.

### Objective
Bootstrap a Career Profile from an existing resume file, as a starting
baseline the user reviews and edits — not a substitute for manually
authoring real Evidence entries.

### Features
- Upload a PDF or DOCX resume; AI extracts experiences, projects, and
  skills
- **Nothing is auto-saved.** Unlike every other AI flow in the app (which
  has an automated truth-check — schema validation, citation verification
  against existing rows), import has no pre-existing profile to verify
  extracted claims against. The extracted data is shown in an editable
  review screen (include/exclude, edit any field) and only written to the
  database after explicit confirmation — human review is the truth-check
  for this specific feature.
- Imported skills always get `evidence_strength: 'none'` — a bare resume
  mention isn't the same as real evidence; the DB already refuses
  `'direct'` without a linked evidence row, so upgrading a skill's
  strength is a deliberate next step the user takes manually.
- Evidence entries are **not** auto-generated from resume bullets —
  expanding a compressed bullet into invented Problem/Action/Result
  fields would itself be a form of inventing narrative structure not
  actually present in the source. Evidence stays a deliberately
  user-authored artifact.
- Duplicate skill names (case-insensitive) against the existing profile
  are skipped, not re-inserted.

### Database
No new tables — inserts directly into `experiences`, `accomplishments`,
`skills`, `projects` via the existing schema.

### Acceptance Criteria
- [ ] Upload a PDF resume → extracted experiences/projects/skills shown
      for review before anything is saved (not yet tested live — DOCX was
      tested instead; PDF path only verified via a standalone script, not
      through the actual upload UI)
- [x] Upload a DOCX resume → extracted experiences/projects/skills shown
      for review, confirmed live on jobpilot-sandy.vercel.app
- [x] Can exclude or edit any extracted item before saving — confirmed live
- [x] Confirmed items are saved as real Career Profile rows, scoped to the
      user — confirmed live
- [x] Build passes

---

## Phase 2 — Job Analyzer

**Status:** DONE

### Objective
Turn a pasted job URL or description into structured, stored data.

### Features
- Paste URL or paste full job description
- AI extracts: company, title, location, remote/hybrid, salary, responsibilities, required qualifications, preferred qualifications, technologies, experience/education requirements, keywords
- Job description is treated as **untrusted input** (see CLAUDE.md) — never executed as instructions
- Save a snapshot of the original description (companies edit/remove listings later)

### Database
- `jobs`
- `job_requirements`

### Acceptance Criteria
- [x] Paste a URL → job saved with extracted fields
- [x] Paste raw text → same result
- [x] Original description snapshot stored verbatim
- [x] Errors handled gracefully (bad URL, unparseable content) — SSRF guard
      verified against private/reserved IPs and non-http(s) schemes
- [x] Build passes

---

## Phase 3 — Match Engine

**Status:** DONE

### Objective
Score a job against the Career Profile and give a clear apply/skip recommendation — not a fake "ATS score."

### Features
- Job Fit score broken into: required skills, relevant experience, industry/domain, seniority, preferred skills, resume representation
- Strong / Partial / Missing breakdown, each tied to actual evidence
- Recommendation: **Apply / Apply–Stretch / Maybe / Skip** (never a hard auto-reject on one missing preferred skill)
- "Why You Match" view: strong fit, transferable fit, gaps

### Database
- `job_scores`

### Acceptance Criteria
- [x] Given a job + career profile, a score and recommendation is generated
- [x] Every claim in the breakdown traces to a specific experience/skill/evidence row
      — enforced by a DB check constraint, not just convention
- [x] Recommendation logic is inspectable, not a black box — a single
      function where "skip" is reachable through exactly one gate
      (required-skills score); verified this can never fire on
      preferred/domain/seniority/representation gaps alone
- [x] Build passes

---

## Phase 4 — Resume Engine

**Status:** DONE

### Objective
Generate a tailored, truthful resume from the Career Profile + a specific job.

### Features
- Code-driven resume template (AI fills content, app controls formatting — ATS-safe: single-column, no graphics/tables/text boxes)
- Tailoring changes: summary, skill ordering/selection, bullet ordering/wording, project selection, technical emphasis
- Never invents experience
- Resume Library: Master Resume → per-job tailored versions, each versioned
  (v1, v2, v3...) — simplified from the original 3-tier "role-specific"
  taxonomy; `based_on_version_id` still allows any version to be used as a
  starting point for another
- Original vs. tailored comparison view
- No `resume_templates` table — one hardcoded ATS-safe template in
  `lib/resume/template.ts` (flagged deviation, approved during planning)
- Match-quality warning: if a job's required-skills match is below Match
  Engine's own "skip" threshold, both the job's Resume card and the
  generated version's page show a warning (not a block — generation still
  proceeds) — added after live testing showed a weak-match tailored resume

### Database
- `resume_versions`
- `resume_sections`

### Acceptance Criteria
- [x] One click produces a tailored DOCX from a job + career profile —
      confirmed live; DOCX opens correctly with proper single-column
      formatting, grouped bullets, and comma-separated skills
- [x] Every resume version is saved and tied to the job it was generated
      for (`job_id`, `NULL` for the Master Resume)
- [x] Comparison view shows what changed vs. the master resume —
      confirmed live (Added/Removed/Reworded, matched by cited Career
      Profile row so a reworded bullet reads as reworded, not
      add+remove)
- [x] Build passes

---

## Phase 5 — Truth Guard

**Status:** DONE (not live-tested on jobpilot-sandy.vercel.app — user chose to
skip live verification and move on to Phase 6; correctness is backed by
typecheck/lint/build passing, the migration confirmed applied via a direct
`information_schema.columns` query, and the DB-level guarantee that a
fabricated citation cannot be persisted, carried over unchanged from Phase 4)

### Objective
Mandatory verification layer: every generated resume claim must trace to real evidence.

### Features
- Each `resume_sections` row carries `user_verified`/`verified_at`; confidence
  ("well-evidenced" vs. "thin") is computed live from the cited row's real
  evidence strength rather than stored, via a helper shared with Match
  Engine's own scoring (`isCitationWellEvidenced`)
- "Why did I say this?" — new `/resume/[versionId]/review` page reveals the
  full underlying evidence (citation label + Problem/Action/Result or
  equivalent) for any claim
- `resume_versions.status` (`draft`/`finalized`); the `finalizeResumeVersion`
  action refuses the transition unless every claim in the version is
  `user_verified`, reporting exactly how many remain
- The review page also lists Career Profile skills not cited anywhere in
  that resume version, distinguishing "you have this skill, it's just not on
  this resume" from "you don't have this skill"

### Acceptance Criteria
- [x] No resume can be finalized with an unverified claim — enforced in
      `finalizeResumeVersion`; not live-tested, verified by code review only
- [x] Every bullet is traceable to a specific evidence row — this was
      already unconditionally true since Phase 4 (DB foreign keys +
      `findFabricatedResumeCitation`); Phase 5 surfaces it in the UI
- [x] Build passes — typecheck, lint, and `next build` all clean

---

## Phase 6 — Application Tracker

**Status:** DONE — confirmed live on jobpilot-sandy.vercel.app

### Objective
Personal CRM for the job search.

### Features
- Application record: company/position/URL read through the linked job
  (no duplication — stable, already captured by Job Analyzer); `salary_notes`
  (free text — what was actually discussed, distinct from the posting's
  salary_min/max); date applied derived from `application_status_history`
  rather than stored; resume version used (nullable FK, `on delete set null`);
  `match_score_at_creation` (one-time snapshot of `job_scores.overall_score`
  — `job_scores` has no history, so this is the only way the recorded score
  survives a later re-analysis); `cover_letter_text` (plain manual field, no
  versioning — no generation feature exists); status
- Pipeline: Discovered → Qualified → Resume Generated → Ready → Applied →
  Recruiter Screen → Interview → Final → Offer / Rejected / Ghosted —
  transitions aren't order-restricted (real searches skip/jump stages)
- "Why I applied" tags — freeform `text[]`, same shape as `jobs.technologies`
- Dashboard counts (new opportunities, strong matches, ready to apply,
  applied, interviews) — live queries, not cached (see ADR discussion in
  planning; personal-scale data doesn't warrant a materialized view)
- `application_status_history` — one row per transition, the audit trail
  a single status column can't provide; `applications.status` stays as a
  denormalized "current" column written in the same action, for fast list
  queries
- No hard constraint requiring a `finalized` resume to attach to an
  application (draft-resume warning shown instead, non-blocking) — see
  ADR-013
- `applications.job_id` is `on delete restrict` (an application is
  irreplaceable history, unlike resume/match data which regenerates from
  the job) — this made job deletion able to fail in a real way, so
  `deleteJob` was converted from throw-on-error to the standard
  `ActionState` pattern

### Database
- `applications`
- `application_status_history`
- `contacts`
- `interviews`
- `follow_ups`

### Acceptance Criteria
- [x] Can create/update an application record end-to-end — confirmed live:
      "Track this application" creates one from a job, edit page updates
      salary notes/cover letter/tags/resume version
- [x] Status changes are tracked with timestamps — confirmed live: every
      transition writes a row to `application_status_history` alongside
      the denormalized `applications.status`/`status_updated_at`
- [x] Dashboard reflects live counts — confirmed live: `getDashboardCounts()`
      wired into `/dashboard`, replacing the Phase 0 placeholder
- [x] Build passes — typecheck, lint, and `next build` all clean

---

## Phase 7 — Job Discovery

**Status:** DONE, extended by Phase 7.5 (Adzuna) below. Original Greenhouse-
only build was not live-tested (user chose to skip verification and move
on). User feedback, verbatim: "I think this feature is dumb and will be
replaced." That feedback was acted on directly in Phase 7.5, not just
noted — Adzuna is the broader discovery source the feedback was asking
for. See DECISIONS.md ADR-014 for the original Greenhouse build and why.

### Objective
Pull in jobs automatically instead of pasting one at a time.

### Features
- V1 source: Greenhouse's public Job Board API only (`watched_companies` —
  user adds a company by its board token). Lever/Ashby/Workday explicitly
  deferred, not built — see ADR-014. Manual paste-in (existing Job Analyzer)
  remains the fallback for companies not on Greenhouse.
- Search by role, location, salary range, experience range, exclusions —
  Greenhouse's list API has no query params, so "search" here means "pick
  watched companies" + filtering already-fetched results: role/location/
  exclusions run pre-extraction (cheap, narrows what's inserted); salary/
  experience run post-extraction over the already-processed set (experience
  parsing reuses Match Engine's `parseMinYears`, not a new parser) — stated
  explicitly per the planning constraint rather than silently dropped
- Auto-dedupe on `source_url` via a partial unique index — duplicates are
  skipped and counted, never used to overwrite an existing snapshot
- Scoring reuses the existing `analyzeMatch` unchanged — no second scoring
  mechanism. Extraction + scoring run synchronously per job, batched only
  via sequential client-side calls (no queue/background worker)

### Database
- `watched_companies`
- `jobs.source` (nullable — `'greenhouse'` or null for manual paste/URL)

### Acceptance Criteria
- [x] A search produces a ranked list of scored jobs — implemented via
      watched-company fetch + pre/post-extraction filters + per-job
      "Extract & score"; not live-tested (user skipped verification)
- [x] Duplicate jobs are not re-imported — enforced by a partial unique
      index on `(user_id, source_url)`; not live-tested (user skipped
      verification)
- [x] Build passes — typecheck, lint, and `next build` all clean

---

## Phase 7.5 — Job Discovery: Adzuna source

**Status:** BUILT — awaiting a real `ADZUNA_APP_ID` for a live smoke test
(only `ADZUNA_APP_KEY` was provided). Request/response shape verified
directly against Adzuna's own docs and against the live API with a
placeholder app_id (confirmed reachable, confirmed the documented
`AUTH_FAIL` error shape) — see DECISIONS.md ADR-016 for the full
reasoning, including what could and couldn't be confirmed against
Adzuna's docs.

### Objective
Add a real keyword-searchable discovery source alongside Greenhouse,
directly addressing the "too narrow" feedback on Phase 7's original build.

### Features
- Adzuna kept alongside Greenhouse, not replacing it — see ADR-016 for why
- `lib/discovery/` — shared `DiscoveredJobRaw` output type + shared
  dedup-aware insert (`insert-jobs.ts`) behind the two source modules;
  not a single forced interface, since the two sources' query shapes
  genuinely differ (enumerate-a-company vs. keyword-search-globally)
- Role/location/exclude/salary-min are real Adzuna search parameters,
  pushed server-side — richer than Greenhouse's pre-fetch filters could
  ever be. Recency (`max_days_old`) wired in but flagged as unconfirmed
  against Adzuna's own docs — needs a live smoke test. Experience range
  has no Adzuna equivalent; reuses the existing post-extraction
  `parseMinYears` filter unchanged (already source-agnostic)
- Adzuna search results are always a snippet, never full text (confirmed
  from Adzuna's own docs) — full text comes from running the existing
  SSRF-guarded `fetchJobPageText` against each result's `redirect_url`,
  concurrently across the batch; falls back to the snippet
  (`jobs.is_snippet_only = true`) on failure or suspiciously short text
- Dedup unified across **both** sources on `(user_id, source, external_id)`
  — Greenhouse's list API already had a stable per-job id, just uncaptured
  before; the old `source_url`-based index is kept alongside the new one,
  no backfill needed
- Zero changes to `extractJobFields`, `analyzeMatch`, or any scoring logic
- "via Adzuna" attribution link on Adzuna-sourced rows, per Adzuna's ToS

### Database
- `jobs.external_id` (nullable text), `jobs.is_snippet_only` (boolean)
- `jobs.source` check constraint extended to include `'adzuna'`
- New partial unique index `(user_id, source, external_id)`, alongside
  (not replacing) the existing `source_url` index

### Acceptance Criteria
- [x] Adzuna search maps every UI filter to a real parameter or an
      explicit, documented fallback (experience range) — no filter
      silently dropped
- [ ] A real search against Adzuna returns results, upgrades to full text
      where possible, and lands in the unified discovered-jobs list —
      blocked on a real `ADZUNA_APP_ID`
- [ ] `max_days_old` behaves as expected — needs the live smoke test above
- [x] Duplicate jobs are not re-imported across either source — enforced
      by the new partial unique index; not live-tested pending credentials
- [x] Build passes — typecheck, lint, and `next build` all clean

---

## Phase 8 — Application Assistant

**Status:** BUILT — awaiting manual browser verification (see
extension/README.md; this is the first phase I have no way to test
myself, not a case of skipping optional verification)

### Objective
Speed up manual application submission without submitting on your behalf.

### Features
- Separate browser extension (`extension/`, Vite + Manifest V3) — not
  part of the core Next.js app, own `package.json`/toolchain
- Auth: embeds the Supabase client directly, 6-digit email-OTP sign-in
  typed into the popup; every read goes through the same RLS policies
  as the main app — no new API surface, no token system (ADR-015)
- Detects form fields on the current tab only when the user clicks
  "Detect fields" (on-demand injection via `activeTab`, no persistent
  content script, no broad host permissions)
- Pulls answers from the verified Career Profile — years of experience
  computed via the existing `computeExperienceYears` (reused from Match
  Engine, not reimplemented), skill yes/no and work authorization read
  as stored facts, never inferred
- Structured/factual answers only this phase — no AI-generated prose
- You review and fill manually, per field; nothing is ever submitted —
  enforced structurally (no submit action exists in the content
  script's message protocol at all)
- Two schema gaps found and fixed while building: `profiles` gained
  `work_authorization_status`, `requires_sponsorship`, and `phone` —
  none of this existed anywhere in the Career Profile before

### Database
- `profiles.work_authorization_status`, `profiles.requires_sponsorship`, `profiles.phone`

### Acceptance Criteria
- [ ] Extension detects and lists fields on a real application form —
      implemented; needs a manual load-unpacked + real-page pass
- [ ] Suggested answers are pulled from stored, verified data —
      derivation logic verified via throwaway test scripts (cross-checked
      against Match Engine's own experience-years output); live UI pass
      still needed
- [x] Nothing is submitted without manual action — structurally enforced
      (no submit action exists in the codebase), verifiable by reading
      `extension/src/lib/messages.ts` and `extension/src/content/index.ts`
- [x] Build passes — both the main app and the extension package
      typecheck and build clean

---

## Phase 9 — Analytics

**Status:** NOT STARTED

### Objective
Turn application history into decision-making data.

### Features
- Applications / qualified / interviews / interview rate
- Average match score: interviewed vs. not interviewed
- Best-performing role category, resume version, salary range
- Pattern surfacing ("higher interview rate for AI automation roles than traditional SWE roles")

### Acceptance Criteria
- [ ] Analytics view reflects real application data
- [ ] At least 3 breakdowns (by category, by resume version, by salary range)
- [ ] Build passes

---

## Phase 10 — Monetization

**Status:** NOT STARTED — do not start until Phases 0–9 are proven on personal use

### Objective
Add Stripe and multi-user support only after the product has proven itself for you personally.

### Features
- `subscription_status` field on user (free/pro) added early at the schema level, but billing UI/logic deferred until this phase
- Stripe checkout + webhook → updates `subscription_status`
- Tiering (e.g., Free: limited analyses/month; Pro: unlimited)

### Acceptance Criteria
- [ ] Stripe webhook correctly updates subscription status
- [ ] Feature gating works based on subscription tier
- [ ] Build passes
