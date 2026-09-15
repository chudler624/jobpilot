import * as cheerio from "cheerio";
import type { DiscoveredJobRaw, DiscoveryResult } from "@/lib/discovery/types";

const FETCH_TIMEOUT_MS = 10_000;
const BOARD_TOKEN_PATTERN = /^[a-zA-Z0-9_-]+$/;

const LOOKS_LIKE_TAGS = /<[a-z][\s\S]*>/i;
const MAX_STRIP_PASSES = 3;

// Greenhouse's `content` field is HTML, but several boards (verified
// live against gitlab/stripe) return it HTML-entity-encoded on top of
// that — a single cheerio pass just decodes the entities into literal
// "<div>"-looking text without stripping it, since there was no real tag
// structure to parse. Re-running the strip while the result still looks
// like markup handles both single- and double-encoded content, bounded
// so it can't loop forever on adversarial input.
function stripHtml(html: string): string {
  let text = html;
  for (let i = 0; i < MAX_STRIP_PASSES; i++) {
    const $ = cheerio.load(text);
    text = $.root().text().replace(/\s+/g, " ").trim();
    if (!LOOKS_LIKE_TAGS.test(text)) break;
  }
  return text;
}

// Greenhouse's public Job Board API — documented for external consumption
// (companies use it to embed their own listings elsewhere), distinct in
// kind from scraping LinkedIn/Indeed (ADR-009). The host is fixed to
// Greenhouse's own API, not user-supplied, so this doesn't need
// fetchJobPageText's private-IP/SSRF guard — but board_token IS
// user-supplied and gets interpolated into the request path, so it's
// validated to a safe character set first.
export async function fetchGreenhouseJobs(
  boardToken: string
): Promise<DiscoveryResult> {
  if (!BOARD_TOKEN_PATTERN.test(boardToken)) {
    return { ok: false, error: "Board token can only contain letters, numbers, hyphens, and underscores" };
  }

  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs?content=true`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "jobpilot/1.0 (personal job-search tool)" },
    });
  } catch {
    return { ok: false, error: "Couldn't reach Greenhouse's API" };
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 404) {
    return { ok: false, error: "No Greenhouse board found for that token" };
  }
  if (!response.ok) {
    return { ok: false, error: `Greenhouse returned an error (${response.status})` };
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return { ok: false, error: "Greenhouse returned an unexpected response" };
  }

  const rawJobs = (data as { jobs?: unknown[] })?.jobs;
  if (!Array.isArray(rawJobs)) {
    return { ok: false, error: "Greenhouse returned an unexpected response" };
  }

  const jobs: DiscoveredJobRaw[] = rawJobs
    .map((raw): DiscoveredJobRaw | null => {
      const j = raw as {
        id?: unknown;
        title?: unknown;
        absolute_url?: unknown;
        content?: unknown;
        location?: { name?: unknown };
      };
      if (typeof j.title !== "string" || typeof j.absolute_url !== "string") {
        return null;
      }
      const rawDescription =
        typeof j.content === "string" ? stripHtml(j.content) : "";
      if (!rawDescription) return null;

      return {
        title: j.title,
        company: null, // filled in by the caller from the watched_companies row
        sourceUrl: j.absolute_url,
        // Greenhouse's list API already returns a stable numeric id per
        // job — previously uncaptured; now shared with Adzuna's dedup key.
        externalId:
          typeof j.id === "number" || typeof j.id === "string" ? String(j.id) : null,
        rawDescription,
        snippetOnly: false,
        location:
          typeof j.location?.name === "string" ? j.location.name : null,
        salaryMin: null,
        salaryMax: null,
      };
    })
    .filter((j): j is DiscoveredJobRaw => j !== null);

  return { ok: true, jobs };
}
