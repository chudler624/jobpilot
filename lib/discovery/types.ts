// Shared shape both discovery sources normalize into. Greenhouse enumerates
// one company's board; Adzuna keyword-searches globally — genuinely
// different query models, so the sources keep their own natural input
// signatures rather than being forced behind one search() method. Only the
// output shape and the insert/dedup path (lib/discovery/insert-jobs.ts) are
// actually shared.
export interface DiscoveredJobRaw {
  title: string;
  company: string | null;
  location: string | null;
  /** Stable id from the source, used for dedup. Null only if a source can't provide one. */
  externalId: string | null;
  sourceUrl: string | null;
  rawDescription: string;
  /** True when rawDescription is a truncated snippet, not the full posting. */
  snippetOnly: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
}

export type DiscoveryResult =
  | { ok: true; jobs: DiscoveredJobRaw[] }
  | { ok: false; error: string };
