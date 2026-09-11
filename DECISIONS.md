# Architecture Decisions

## ADR-001 — Database: Supabase PostgreSQL
**Decision:** Use Supabase for database, auth, and storage.
**Reason:** Free tier is generous (500MB DB, 1GB storage, 5GB egress, 50k MAU), real PostgreSQL under the hood, and auth/storage come bundled instead of being built by hand.

## ADR-002 — Hosting: Vercel
**Decision:** Deploy on Vercel.
**Reason:** Native, effectively zero-config Next.js deployment; free Hobby tier is enough for a personal prototype; GitHub → Vercel gives automatic deploys on every commit.

## ADR-003 — AI Provider: Gemini (behind an abstraction layer)
**Decision:** Start with Gemini (e.g., 2.5 Flash) via a swappable provider layer.
**Reason:** Free tier is sufficient for single-user testing. The provider layer means we can swap in Claude, DeepSeek, or a different Gemini model later without rewriting business logic. Do not assume any specific Gemini model/version stays current — check pricing/availability when wiring this up, since Google's lineup changes.
**Note:** Free-tier Gemini terms may allow Google to use prompts/responses to improve their products; paid tier does not. Acceptable for a private single-user prototype containing only the user's own data — revisit before any other person's resume/data enters the system.

## ADR-004 — Frontend: Next.js + TypeScript
**Decision:** Single Next.js application (frontend + API routes), not a separate frontend/backend split.
**Reason:** One codebase, works well with Claude Code, avoids premature complexity.

## ADR-005 — Browser automation / application autofill: Deferred to Phase 8
**Decision:** Do not build browser automation into the core app. When built, it will be a separate browser extension, not part of the Next.js codebase.
**Reason:** Not required to validate the core product (Career Profile → Job Analysis → Match → Tailored Resume → Tracking). Keeps the core app's architecture clean.

## ADR-006 — No automated application submission
**Decision:** The app prepares and assists; a human always reviews and submits.
**Reason:** Safer, avoids fragile per-site scraping/automation, and avoids submitting incorrect or ungenuine answers on the user's behalf.

## ADR-007 — Multi-user-capable schema, single-user product for now
**Decision:** Design tables with a `user_id` / ownership model from day one, but do not build any team/org/admin/billing UI until Phase 10.
**Reason:** Avoids a rewrite later if this becomes a SaaS, without spending time now on features that don't matter for a single user.

## ADR-008 — Job descriptions and scraped content are untrusted input
**Decision:** Any externally sourced text (job postings, fetched pages) is treated strictly as data to parse, never as instructions.
**Reason:** Prompt-injection risk — a job posting or webpage could contain text designed to manipulate the AI's behavior.

## ADR-009 — No LinkedIn/Indeed scraping dependency
**Decision:** Primary job discovery relies on company career pages and ATS platforms (Greenhouse, Lever, Ashby, Workday, etc.) or manual paste-in, not scraping LinkedIn or Indeed directly.
**Reason:** Both platforms prohibit automated scraping in their terms; building a dependency on it makes the product fragile and puts the account at risk.

## ADR-010 — Resume import requires human review before persisting
**Decision:** AI-extracted Career Profile data from an uploaded resume (Phase 1.5) is never auto-saved. It's shown in an editable review screen (include/exclude, edit any field) and only written to the database after explicit user confirmation.
**Reason:** Every other AI flow in the app has an automated truth-check available — a zod schema validates shape, and where the AI cites an existing row (Match Engine, Resume Engine), code independently verifies that citation against the real profile. Resume import has no such net: the AI is *creating* new claims about the user's history, not citing existing ones, so there's nothing pre-existing to verify against. Human review is the truth-check for this specific flow, not a UX nicety.

## ADR-011 — Resume file text extraction: unpdf + mammoth
**Decision:** Use `unpdf` for PDF text extraction and `mammoth` for DOCX text extraction (reading existing files), for the Phase 1.5 resume-import feature.
**Reason:** `unpdf` is built for serverless/edge runtimes (matches Vercel), verified actively maintained (checked npm registry directly rather than assumed). `mammoth` is the established library for converting existing `.docx` content to text. Both are distinct from `docx` (Phase 4's planned generation library), which can write new `.docx` files but cannot usefully read arbitrary existing ones back out.

## ADR-012 — Truth Guard's "finalize" gates a human-confirmation milestone, not download access
**Decision:** A resume version's `draft` → `finalized` transition (Phase 5) requires every `resume_sections` row to be `user_verified`, but `status` never restricts the existing Download action — a draft resume downloads exactly as it did before Phase 5.
**Reason:** Phase 4's citation-fabrication check (DB foreign keys + `findFabricatedResumeCitation`) already makes a fabricated claim impossible to persist, unconditionally — so nothing about download itself is unsafe pre-finalization. Gating download on finalize status would reintroduce the same kind of hard block already rejected once during Phase 4 live testing ("it should just produce a warning, but not completely refuse to do it"). Finalize is instead an opt-in trust milestone the user reaches after reviewing each claim's evidence on the new `/resume/[versionId]/review` page — its main effect today is the Draft/Finalized badge; it's also the flag a future Application Tracker phase will likely want to read (e.g. "only finalized resumes can be attached to an application"), but that integration is explicitly not built now.
**Note:** Confidence ("well-evidenced" vs. "thin") is computed on read from the cited row's live `evidence_strength`/`verified` data via a shared `isCitationWellEvidenced` helper (`lib/match/score.ts`), reused as-is from Match Engine's `resume_representation_score` — not stored, so it can't go stale if the Career Profile changes after generation.
