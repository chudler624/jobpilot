# AI JOB SEARCH OS

## Current Status

Phase: 1 / 10
Progress: 18% (Phases 0-1 of 10 complete)

Current Goal:
Begin Phase 2 — Job Analyzer.

---

## Roadmap

- [x] Phase 0 — Foundation
- [x] Phase 1 — Career Profile
- [ ] Phase 2 — Job Analyzer
- [ ] Phase 3 — Match Engine
- [ ] Phase 4 — Resume Engine
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

## Phase 2 — Job Analyzer

**Status:** NOT STARTED

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
- [ ] Paste a URL → job saved with extracted fields
- [ ] Paste raw text → same result
- [ ] Original description snapshot stored verbatim
- [ ] Errors handled gracefully (bad URL, unparseable content)
- [ ] Build passes

---

## Phase 3 — Match Engine

**Status:** NOT STARTED

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
- [ ] Given a job + career profile, a score and recommendation is generated
- [ ] Every claim in the breakdown traces to a specific experience/skill/evidence row
- [ ] Recommendation logic is inspectable, not a black box
- [ ] Build passes

---

## Phase 4 — Resume Engine

**Status:** NOT STARTED

### Objective
Generate a tailored, truthful resume from the Career Profile + a specific job.

### Features
- Code-driven resume template (AI fills content, app controls formatting — ATS-safe: single-column, no graphics/tables/text boxes)
- Tailoring changes: summary, skill ordering/selection, bullet ordering/wording, project selection, technical emphasis
- Never invents experience
- Resume Library: Master Resume → role-specific versions → per-company versions, each versioned (v1, v2, v3...)
- Original vs. tailored comparison view

### Database
- `resume_templates`
- `resume_versions`
- `resume_sections`

### Acceptance Criteria
- [ ] One click produces a tailored DOCX from a job + career profile
- [ ] Every resume version is saved and tied to the job it was generated for
- [ ] Comparison view shows what changed vs. the master resume
- [ ] Build passes

---

## Phase 5 — Truth Guard

**Status:** NOT STARTED

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
