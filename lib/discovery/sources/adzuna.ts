import { fetchJobPageText } from "@/lib/jobs/fetch-job-page";
import type { DiscoveredJobRaw, DiscoveryResult } from "@/lib/discovery/types";

const FETCH_TIMEOUT_MS = 10_000;
const MIN_FULLTEXT_LENGTH = 200;

// Gemini's free tier, not Adzuna's own rate limit, is the real constraint
// (every result costs ~2 AI calls once the user clicks "Extract & score").
// One page per run; raise this constant later if that budget allows it.
export const ADZUNA_RESULTS_PER_PAGE = 20;

// Verified against Adzuna's own docs at planning time; not an exhaustive
// list, just the countries commonly covered — extend if ADZUNA_COUNTRY
// needs one that isn't here yet.
const SUPPORTED_COUNTRIES = new Set([
  "gb", "us", "at", "au", "br", "ca", "de", "fr", "in", "it",
  "mx", "nl", "nz", "pl", "sg", "za", "es", "ch",
]);

export interface AdzunaSearchFilters {
  what?: string | null;
  where?: string | null;
  whatExclude?: string | null;
  salaryMin?: number | null;
  /** Not independently confirmed against Adzuna's own docs — smoke-test
   *  before relying on it; omitted from the request if not set. */
  maxDaysOld?: number | null;
}

interface AdzunaRawResult {
  id?: unknown;
  title?: unknown;
  company?: { display_name?: unknown };
  location?: { display_name?: unknown };
  description?: unknown;
  redirect_url?: unknown;
  salary_min?: unknown;
  salary_max?: unknown;
}

// Adzuna's public search API — a legitimate aggregator with its own terms
// of service (ADR-016), categorically different from scraping LinkedIn or
// Indeed directly (ADR-009). Search results are always a truncated
// snippet, never the full posting — see upgradeToFullText below.
export async function fetchAdzunaJobs(
  filters: AdzunaSearchFilters
): Promise<DiscoveryResult> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) {
    return {
      ok: false,
      error: "Adzuna isn't configured — set ADZUNA_APP_ID and ADZUNA_APP_KEY.",
    };
  }

  const country = (process.env.ADZUNA_COUNTRY || "us").toLowerCase();
  if (!SUPPORTED_COUNTRIES.has(country)) {
    return {
      ok: false,
      error: `ADZUNA_COUNTRY "${country}" isn't a recognized Adzuna country code.`,
    };
  }

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: String(ADZUNA_RESULTS_PER_PAGE),
    "content-type": "application/json",
  });
  if (filters.what) params.set("what", filters.what);
  if (filters.where) params.set("where", filters.where);
  if (filters.whatExclude) params.set("what_exclude", filters.whatExclude);
  if (filters.salaryMin) params.set("salary_min", String(filters.salaryMin));
  if (filters.maxDaysOld) params.set("max_days_old", String(filters.maxDaysOld));

  const url = `https://api.adzuna.com/v1/api/jobs/${encodeURIComponent(country)}/search/1?${params.toString()}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "jobpilot/1.0 (personal job-search tool)" },
    });
  } catch {
    return { ok: false, error: "Couldn't reach Adzuna's API" };
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401) {
    return { ok: false, error: "Adzuna rejected the configured app_id/app_key." };
  }
  if (!response.ok) {
    return { ok: false, error: `Adzuna returned an error (${response.status})` };
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return { ok: false, error: "Adzuna returned an unexpected response" };
  }

  const results = (data as { results?: unknown[] })?.results;
  if (!Array.isArray(results)) {
    return { ok: false, error: "Adzuna returned an unexpected response" };
  }

  const jobs: DiscoveredJobRaw[] = results
    .map((raw): DiscoveredJobRaw | null => {
      const j = raw as AdzunaRawResult;
      if (typeof j.title !== "string" || typeof j.redirect_url !== "string") {
        return null;
      }
      const externalId =
        typeof j.id === "string" || typeof j.id === "number" ? String(j.id) : null;
      const description = typeof j.description === "string" ? j.description.trim() : "";
      if (!externalId || !description) return null;

      return {
        title: j.title,
        company:
          typeof j.company?.display_name === "string" ? j.company.display_name : null,
        location:
          typeof j.location?.display_name === "string" ? j.location.display_name : null,
        externalId,
        sourceUrl: j.redirect_url,
        rawDescription: description, // snippet; upgraded below when possible
        snippetOnly: true,
        salaryMin: typeof j.salary_min === "number" ? Math.round(j.salary_min) : null,
        salaryMax: typeof j.salary_max === "number" ? Math.round(j.salary_max) : null,
      };
    })
    .filter((j): j is DiscoveredJobRaw => j !== null);

  return { ok: true, jobs };
}

// Adzuna's redirect_url points at the real listing; fetchJobPageText is
// the same SSRF-guarded fetch Job Analyzer already uses for pasted URLs —
// reused unchanged, not reimplemented. Run concurrently, not in a loop:
// each call already has its own ~10s internal timeout, and this runs
// inside one server-action invocation, so doing up to
// ADZUNA_RESULTS_PER_PAGE of them sequentially could push a single
// discovery run well past a serverless function's time budget.
export async function upgradeToFullText(
  jobs: DiscoveredJobRaw[]
): Promise<DiscoveredJobRaw[]> {
  const upgraded = await Promise.all(
    jobs.map(async (job) => {
      if (!job.sourceUrl) return job;
      const fetched = await fetchJobPageText(job.sourceUrl);
      if (fetched.ok && fetched.text.length >= MIN_FULLTEXT_LENGTH) {
        return { ...job, rawDescription: fetched.text, snippetOnly: false };
      }
      return job; // falls back to the Adzuna snippet, snippetOnly stays true
    })
  );
  return upgraded;
}
