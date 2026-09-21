import { stripHtml } from "@/lib/discovery/sources/greenhouse";
import type { DiscoveredJobRaw, DiscoveryResult } from "@/lib/discovery/types";

const FETCH_TIMEOUT_MS = 10_000;
const MIN_DESCRIPTION_LENGTH = 50;
const RESULT_LIMIT = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface JobicySearchFilters {
  what: string;
  where?: string | null;
  maxDaysOld?: number | null;
}

interface JobicyRawJob {
  id?: unknown;
  url?: unknown;
  jobTitle?: unknown;
  companyName?: unknown;
  jobGeo?: unknown;
  jobDescription?: unknown;
  pubDate?: unknown;
}

// Jobicy's public remote-jobs API — free, no key, and (unlike Adzuna)
// returns the FULL posting text. Its terms require crediting Jobicy with a
// direct link to the original listing (done in the UI). Remote roles only.
// `tag` is a real keyword filter (live-verified: a nonsense tag returns
// zero jobs). Salary is left null — not reliably present in the feed, so a
// min-salary filter can't apply to it.
// (Remotive was tried first and dropped: its public API ignores `search`
// entirely and returns the same 18 jobs for any query.)
export async function fetchJobicyJobs(
  filters: JobicySearchFilters
): Promise<DiscoveryResult> {
  const params = new URLSearchParams({
    tag: filters.what,
    count: String(RESULT_LIMIT),
  });
  const url = `https://jobicy.com/api/v2/remote-jobs?${params.toString()}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "jobpilot/1.0 (personal job-search tool)" },
    });
  } catch {
    return { ok: false, error: "Couldn't reach Jobicy's API" };
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    return { ok: false, error: `Jobicy returned an error (${response.status})` };
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return { ok: false, error: "Jobicy returned an unexpected response" };
  }

  const results = (data as { jobs?: unknown[] })?.jobs;
  if (!Array.isArray(results)) {
    return { ok: false, error: "Jobicy returned an unexpected response" };
  }

  const where = filters.where?.toLowerCase() ?? null;
  const cutoff = filters.maxDaysOld ? Date.now() - filters.maxDaysOld * DAY_MS : null;

  const jobs: DiscoveredJobRaw[] = results
    .map((raw): DiscoveredJobRaw | null => {
      const j = raw as JobicyRawJob;
      if (typeof j.jobTitle !== "string" || typeof j.url !== "string") return null;
      const externalId =
        typeof j.id === "string" || typeof j.id === "number" ? String(j.id) : null;
      const description =
        typeof j.jobDescription === "string"
          ? // Break at block-level tags first so stripping doesn't glue
            // adjacent lines together ("RemoteAvailability").
            stripHtml(j.jobDescription.replace(/<(br|\/p|\/li|\/div|\/h[1-6])\b[^>]*>/gi, "$& "))
          : "";
      if (!externalId || description.length < MIN_DESCRIPTION_LENGTH) return null;

      const location = typeof j.jobGeo === "string" ? j.jobGeo : null;

      // jobGeo is a "who may apply" region (e.g. "USA", "LATAM", "Anywhere"),
      // not a city. Keep worldwide/unspecified postings alongside ones that
      // mention the term.
      if (where && location) {
        const loc = location.toLowerCase();
        const open = /worldwide|anywhere/.test(loc);
        if (!open && !loc.includes(where)) return null;
      }
      if (cutoff && typeof j.pubDate === "string") {
        const published = Date.parse(j.pubDate);
        if (!Number.isNaN(published) && published < cutoff) return null;
      }

      return {
        title: j.jobTitle,
        company: typeof j.companyName === "string" ? j.companyName : null,
        location,
        externalId,
        sourceUrl: j.url,
        rawDescription: description,
        snippetOnly: false,
        salaryMin: null,
        salaryMax: null,
      };
    })
    .filter((j): j is DiscoveredJobRaw => j !== null);

  return { ok: true, jobs };
}
