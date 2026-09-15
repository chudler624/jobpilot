import { createClient } from "@/lib/supabase/server";
import type { DiscoveredJobRaw } from "@/lib/discovery/types";
import type { JobSource } from "@/types/supabase";

export interface InsertJobsResult {
  added: number;
  duplicates: number;
}

// Shared dedup-aware insert path for both discovery sources. Sequential,
// not batched — lets a duplicate (23505 on either the
// (user_id, source, external_id) or the legacy source_url unique index)
// be caught and counted per row, which a single batch insert can't do.
// Never overwrites an existing row on a duplicate: raw_description is a
// point-in-time snapshot (established in Phase 2), and silently
// refreshing it on rediscovery would break that.
export async function insertDiscoveredJobs(
  userId: string,
  source: JobSource,
  jobs: DiscoveredJobRaw[]
): Promise<InsertJobsResult | { error: string }> {
  const supabase = await createClient();
  let added = 0;
  let duplicates = 0;

  for (const job of jobs) {
    const { error } = await supabase.from("jobs").insert({
      user_id: userId,
      source,
      external_id: job.externalId,
      source_url: job.sourceUrl,
      raw_description: job.rawDescription,
      is_snippet_only: job.snippetOnly,
      company: job.company,
      title: job.title,
      location: job.location,
      salary_min: job.salaryMin,
      salary_max: job.salaryMax,
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

  return { added, duplicates };
}
