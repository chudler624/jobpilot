"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fetchGreenhouseJobs } from "@/lib/discovery/sources/greenhouse";
import { fetchAdzunaJobs, upgradeToFullText } from "@/lib/discovery/sources/adzuna";
import { insertDiscoveredJobs } from "@/lib/discovery/insert-jobs";
import { ensureJobRequirements } from "@/lib/jobs/extract-requirements";
import { parseJobsCsv } from "@/lib/jobs/parse-jobs-csv";
import {
  watchedCompanySchema,
  discoveryFiltersSchema,
  adzunaSearchSchema,
  type DiscoverState,
  type CsvImportState,
} from "@/lib/jobs/discovery-schemas";
import { parseFormData, type ActionState } from "@/lib/career-profile/schemas";
import type { DiscoveredJobRaw } from "@/lib/discovery/types";
import type { JobSource } from "@/types/supabase";

export async function addWatchedCompany(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseFormData(watchedCompanySchema, formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const check = await fetchGreenhouseJobs(parsed.data.board_token);
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase.from("watched_companies").insert({
    user_id: user.id,
    name: parsed.data.name,
    board_token: parsed.data.board_token,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "You're already watching a company with that board token." };
    }
    return { error: error.message };
  }

  revalidatePath("/jobs/discover");
  return {};
}

export async function deleteWatchedCompany(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("watched_companies").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/jobs/discover");
}

// Fetch and filter only — nothing is saved to `jobs` until the user picks
// specific results via saveDiscoveredJob. Search results (Adzuna
// especially, being broad keyword search rather than a known company's
// full board) are a preview to review, not something to commit sight
// unseen — the same "review before persist" instinct as Phase 1.5's
// resume import (ADR-010), just for discovery instead of extraction.
export async function fetchDiscoveredJobs(
  companyId: string,
  _prevState: DiscoverState,
  formData: FormData
): Promise<DiscoverState> {
  const filters = parseFormData(discoveryFiltersSchema, formData);
  if (!filters.success) {
    return { error: filters.error.issues[0]?.message ?? "Invalid filters" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: company } = await supabase
    .from("watched_companies")
    .select("*")
    .eq("id", companyId)
    .eq("user_id", user.id)
    .single();
  if (!company) return { error: "Watched company not found" };

  const result = await fetchGreenhouseJobs(company.board_token);
  if (!result.ok) return { error: result.error };

  const role = filters.data.role?.toLowerCase() ?? null;
  const location = filters.data.location?.toLowerCase() ?? null;
  const excludeTerms =
    filters.data.exclude
      ?.toLowerCase()
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean) ?? [];

  const matching = result.jobs
    .filter((job) => {
      if (role && !job.title.toLowerCase().includes(role)) return false;
      if (location && !(job.location ?? "").toLowerCase().includes(location)) return false;
      if (excludeTerms.some((term) => job.title.toLowerCase().includes(term))) return false;
      return true;
    })
    // Greenhouse's job objects have no company field of their own — the
    // whole board is one company, so it comes from the watched-company row.
    .map((job) => ({ ...job, company: company.name }));

  return { results: matching };
}

export async function searchAdzuna(
  _prevState: DiscoverState,
  formData: FormData
): Promise<DiscoverState> {
  const filters = parseFormData(adzunaSearchSchema, formData);
  if (!filters.success) {
    return { error: filters.error.issues[0]?.message ?? "Invalid filters" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const result = await fetchAdzunaJobs({
    what: filters.data.what,
    where: filters.data.where,
    whatExclude: filters.data.whatExclude,
    salaryMin: filters.data.salaryMin,
    maxDaysOld: filters.data.maxDaysOld,
  });
  if (!result.ok) return { error: result.error };

  const excludeTerms = (filters.data.whatExclude ?? "")
    .toLowerCase()
    .split(/[,\s]+/)
    .filter(Boolean);
  const kept = result.jobs.filter((job) => !titleMatchesExclusion(job.title, excludeTerms));

  const upgraded = await upgradeToFullText(kept);
  return { results: upgraded };
}

// Adzuna's what_exclude only drops exact words, so excluding "senior"
// still returns "Sr. Software Engineer" (live-verified) — re-check titles
// here, common abbreviations included.
const EXCLUDE_ALIASES: Record<string, string[]> = {
  senior: ["sr"],
  sr: ["senior"],
  junior: ["jr"],
  jr: ["junior"],
  manager: ["mgr"],
  principal: ["prin"],
};

function titleMatchesExclusion(title: string, terms: string[]): boolean {
  return terms
    .flatMap((term) => [term, ...(EXCLUDE_ALIASES[term] ?? [])])
    .some((term) => {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`\\b${escaped}\\b`, "i").test(title);
    });
}

// Saves exactly one reviewed result. A plain function (not a
// (prevState, formData) action) called directly via startTransition from
// the results-preview list, since its input is a nested object from
// client state, not FormData — same shape as Phase 1.5's commitImport.
export async function saveDiscoveredJob(
  source: JobSource,
  job: DiscoveredJobRaw
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const inserted = await insertDiscoveredJobs(user.id, source, [job]);
  if ("error" in inserted) return { error: inserted.error };
  if (inserted.duplicates > 0) return { error: "Already in your tracked jobs." };

  revalidatePath("/jobs/discover");
  return {};
}

// Bulk import of a jobs.csv the user already curated themselves outside
// the app (e.g. exported from their own LinkedIn search). This app does
// not fetch or scrape those URLs — no description is pulled here at all,
// deliberately: automated requests against LinkedIn job pages are off
// the table regardless of account or intent (ADR-009). Each row lands as
// a snippet-only job with just its `source_url`; the existing
// extension-capture (ADR-020) or "Add the full posting" paste box
// (ADR-019) is how a description gets attached, same as any other
// snippet-only job — the user still has to open each link themselves.
const CSV_IMPORT_PLACEHOLDER =
  "Imported from a CSV — no description yet. Open the original listing " +
  "(with the browser extension signed in) or paste the description below.";

export async function importJobsCsv(
  _prevState: CsvImportState,
  formData: FormData
): Promise<CsvImportState> {
  const file = formData.get("csvFile");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a CSV file first." };
  }

  const text = await file.text();
  const parsed = parseJobsCsv(text);
  if ("error" in parsed) return { error: parsed.error };
  if (parsed.rows.length === 0) {
    return { error: "No usable rows found — each row needs a title and a url." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  let added = 0;
  let duplicates = 0;

  for (const row of parsed.rows) {
    const { error } = await supabase.from("jobs").insert({
      user_id: user.id,
      source_url: row.sourceUrl,
      raw_description: CSV_IMPORT_PLACEHOLDER,
      is_snippet_only: true,
      title: row.title,
      company: row.company,
      location: row.location,
    });

    if (error) {
      if (error.code === "23505") {
        duplicates++;
        continue;
      }
      return { error: error.message };
    }
    added++;
  }

  revalidatePath("/jobs");
  revalidatePath("/jobs/discover");
  return { added, duplicates, skipped: parsed.skipped };
}

export async function extractJobRequirements(
  jobId: string,
  _prevState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const result = await ensureJobRequirements(jobId, user.id);
  if (result.error) return { error: result.error };

  revalidatePath("/jobs/discover");
  revalidatePath(`/jobs/${jobId}`);
  return {};
}
