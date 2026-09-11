# AI JOB SEARCH OS

## Current Status

Phase: 4 / 10
Progress: 45% (Phases 0-4 of 10 complete)

Current Goal:
Live-test Phase 5 — Truth Guard on jobpilot-sandy.vercel.app.

---

## Roadmap

- [x] Phase 0 — Foundation
- [x] Phase 1 — Career Profile
- [x] Phase 1.5 — Career Profile Import (added mid-Phase-4 planning, not in the original 0-10 roadmap)
- [x] Phase 2 — Job Analyzer
- [x] Phase 3 — Match Engine
- [x] Phase 4 — Resume Engine
- [ ] Phase 5 — Truth Guard
- [ ] Phase 6 — Application Tracker
- [ ] Phase 7 — Job Discovery
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

**Status:** BUILT — awaiting live verification

### Objective
Mandatory verification layer: every generated resume claim must trace to real evidence.

### Features
- Each generated bullet stores `{claim, source, confidence, user_verified}`
- "Why did I say this?" — reveals the underlying evidence for any bullet
- Claims with no evidence are rejected before the resume is finalized
- Distinguish "you have this skill but it's not represented on your resume" from "you don't have this skill"

### Acceptance Criteria
- [ ] No resume can be finalized with an unverified claim
- [ ] Every bullet is traceable to a specific evidence row
- [ ] Build passes

---

## Phase 6 — Application Tracker

**Status:** NOT STARTED

### Objective
Personal CRM for the job search.

### Features
- Application record: company, position, salary, URL, date applied, resume version used, match score, cover letter version, answers, status
- Pipeline: Discovered → Qualified → Resume Generated → Ready → Applied → Recruiter Screen → Interview → Final → Offer / Rejected / Ghosted
- "Why I applied" tags (remote, comp, AI component, career progression, etc.)
- Dashboard counts (new opportunities, strong matches, ready to apply, applied, interviews, etc.)

### Database
- `applications`
- `contacts`
- `interviews`
- `follow_ups`

### Acceptance Criteria
- [ ] Can create/update an application record end-to-end
- [ ] Status changes are tracked with timestamps
- [ ] Dashboard reflects live counts
- [ ] Build passes

---

## Phase 7 — Job Discovery

**Status:** NOT STARTED

### Objective
Pull in jobs automatically instead of pasting one at a time.

### Features
- Search by role, location, salary range, experience range, exclusions
- Don't depend on scraping LinkedIn/Indeed directly (both prohibit automated scraping) — prefer company career pages / Greenhouse / Lever / Ashby / Workday, or manual paste-in as fallback
- Auto-dedupe, analyze, and score incoming jobs

### Acceptance Criteria
- [ ] A search produces a ranked list of scored jobs
- [ ] Duplicate jobs are not re-imported
- [ ] Build passes

---

## Phase 8 — Application Assistant

**Status:** NOT STARTED

### Objective
Speed up manual application submission without submitting on your behalf.

### Features
- Separate browser extension (not part of the core Next.js app) that detects form fields on an application page
- Pulls answers from the verified career database (including binary answers like years of experience — answered honestly, not creatively)
- You review and submit manually — no automated submission in this phase

### Acceptance Criteria
- [ ] Extension detects and lists fields on a real application form
- [ ] Suggested answers are pulled from stored, verified data
- [ ] Nothing is submitted without manual action
- [ ] Build passes

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
