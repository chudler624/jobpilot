import { stripHtml } from "@/lib/discovery/sources/greenhouse";
import type { DiscoveredJobRaw, DiscoveryResult } from "@/lib/discovery/types";

const FETCH_TIMEOUT_MS = 10_000;
const MIN_DESCRIPTION_LENGTH = 50;
const RESULT_LIMIT = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface RemotiveSearchFilters {
  what: string;
  where?: string | null;
  maxDaysOld?: number | null;
}

interface RemotiveRawJob {
  id?: unknown;
  url?: unknown;
  title?: unknown;
  company_name?: unknown;
  candidate_required_location?: unknown;
  publication_date?: unknown;
  description?: unknown;
}

// Remotive's public remote-jobs API — free, no key, documented for
// external use, and (unlike Adzuna) returns the FULL posting text. Its
// terms require linking back to the listing and naming Remotive as the
// source (both done in the UI) and ask for infrequent polling; results
// here are only fetched on an explicit user search. Remote roles only.
// Remotive's `salary` field is free text ("$90k - $105k"), so salary is
// left null rather than parsed — a min-salary filter can't apply to it.
export async function fetchRemotiveJobs(
  filters: RemotiveSearchFilters
): Promise<DiscoveryResult> {
  const params = new URLSearchParams({
    search: filters.what,
    limit: String(RESULT_LIMIT),
  });
  const url = `https://remotive.com/api/remote-jobs?${params.toString()}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "jobpilot/1.0 (personal job-search tool)" },
    });
  } catch {
    return { ok: false, error: "Couldn't reach Remotive's API" };
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    return { ok: false, error: `Remotive returned an error (${response.status})` };
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return { ok: false, error: "Remotive returned an unexpected response" };
  }

  const results = (data as { jobs?: unknown[] })?.jobs;
  if (!Array.isArray(results)) {
    return { ok: false, error: "Remotive returned an unexpected response" };
  }

  const where = filters.where?.toLowerCase() ?? null;
  const cutoff = filters.maxDaysOld ? Date.now() - filters.maxDaysOld * DAY_MS : null;

  const jobs: DiscoveredJobRaw[] = results
    .map((raw): DiscoveredJobRaw | null => {
      const j = raw as RemotiveRawJob;
      if (typeof j.title !== "string" || typeof j.url !== "string") return null;
      const externalId =
        typeof j.id === "string" || typeof j.id === "number" ? String(j.id) : null;
      const description =
        typeof j.description === "string"
          ? // Break at block-level tags first so stripping doesn't glue
            // adjacent lines together ("RemoteAvailability").
            stripHtml(j.description.replace(/<(br|\/p|\/li|\/div|\/h[1-6])\b[^>]*>/gi, "$& "))
          : "";
      if (!externalId || description.length < MIN_DESCRIPTION_LENGTH) return null;

      const location =
        typeof j.candidate_required_location === "string"
          ? j.candidate_required_location
          : null;

      // Remotive's location is a "who may apply" region, not a city. Keep
      // worldwide/unspecified postings alongside ones that mention the term.
      if (where && location) {
        const loc = location.toLowerCase();
        const open = /worldwide|anywhere/.test(loc);
        if (!open && !loc.includes(where)) return null;
      }
      if (cutoff && typeof j.publication_date === "string") {
        const published = Date.parse(j.publication_date);
        if (!Number.isNaN(published) && published < cutoff) return null;
      }

      return {
        title: j.title,
        company: typeof j.company_name === "string" ? j.company_name : null,
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
