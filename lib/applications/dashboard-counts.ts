import { createClient } from "@/lib/supabase/server";
import { APPLIED_OR_LATER } from "@/lib/applications/schemas";

export interface DashboardCounts {
  newOpportunities: number;
  strongMatches: number;
  readyToApply: number;
  applied: number;
  interviews: number;
}

// Live aggregate queries, not a cached/materialized summary — personal-scale
// data (dozens to low hundreds of rows), so a few small queries on every
// dashboard load is simpler than keeping a cache in sync and cheap enough
// not to matter.
export async function getDashboardCounts(): Promise<DashboardCounts> {
  const supabase = await createClient();
  const [{ data: applications }, { data: jobs }, { data: scores }] =
    await Promise.all([
      supabase.from("applications").select("job_id, status"),
      supabase.from("jobs").select("id"),
      supabase.from("job_scores").select("job_id, recommendation"),
    ]);

  const trackedJobIds = new Set((applications ?? []).map((a) => a.job_id));

  const newOpportunities = (jobs ?? []).filter(
    (j) => !trackedJobIds.has(j.id)
  ).length;

  const strongMatches = (scores ?? []).filter(
    (s) =>
      (s.recommendation === "apply" || s.recommendation === "apply_stretch") &&
      !trackedJobIds.has(s.job_id)
  ).length;

  const readyToApply = (applications ?? []).filter(
    (a) => a.status === "ready"
  ).length;

  const applied = (applications ?? []).filter((a) =>
    (APPLIED_OR_LATER as string[]).includes(a.status)
  ).length;

  const interviews = (applications ?? []).filter(
    (a) => a.status === "recruiter_screen" || a.status === "interview"
  ).length;

  return { newOpportunities, strongMatches, readyToApply, applied, interviews };
}
