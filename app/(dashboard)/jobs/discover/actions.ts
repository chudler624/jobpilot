"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai";
import { fetchGreenhouseJobs } from "@/lib/discovery/sources/greenhouse";
import { fetchAdzunaJobs, upgradeToFullText } from "@/lib/discovery/sources/adzuna";
import { insertDiscoveredJobs } from "@/lib/discovery/insert-jobs";
import { jobExtractionResultSchema } from "@/lib/jobs/schemas";
import {
  watchedCompanySchema,
  discoveryFiltersSchema,
  adzunaSearchSchema,
  type DiscoverState,
} from "@/lib/jobs/discovery-schemas";
import { parseFormData, type ActionState } from "@/lib/career-profile/schemas";

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

function summarize(added: number, duplicates: number): DiscoverState {
  if (added === 0 && duplicates === 0) {
    return { error: "No open jobs matched those filters." };
  }
  return {
    summary: `${added} new job${added === 1 ? "" : "s"} added, ${duplicates} already tracked.`,
  };
}

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

  const inserted = await insertDiscoveredJobs(user.id, "greenhouse", matching);
  if ("error" in inserted) return { error: inserted.error };

  revalidatePath("/jobs/discover");
  return summarize(inserted.added, inserted.duplicates);
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

  // Full-text upgrade only for the results that survived Adzuna's own
  // search filters — no point spending a fetch on something the search
  // already excluded. (Adzuna's `what`/`where`/`what_exclude` already ran
  // server-side, so no further client-side title filtering is needed here
  // the way Greenhouse's unfiltered board listing needs it.)
  const upgraded = await upgradeToFullText(result.jobs);

  const inserted = await insertDiscoveredJobs(user.id, "adzuna", upgraded);
  if ("error" in inserted) return { error: inserted.error };

  revalidatePath("/jobs/discover");
  return summarize(inserted.added, inserted.duplicates);
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

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .single();
  if (!job) return { error: "Job not found" };

  const { data: existing } = await supabase
    .from("job_requirements")
    .select("id")
    .eq("job_id", jobId)
    .maybeSingle();
  if (existing) return {}; // already extracted, nothing to do

  let extracted;
  try {
    const provider = getAIProvider();
    extracted = await provider.extractJobFields({ rawText: job.raw_description });
  } catch {
    return {
      error: "Couldn't analyze this job posting. Please try again in a moment.",
    };
  }

  const validated = jobExtractionResultSchema.safeParse(extracted);
  if (!validated.success) {
    return {
      error: "The AI returned an unexpected format. Please try again.",
    };
  }

  // title/company/location already came from the source's own listing
  // metadata at discovery time and are kept as-is — only backfilling
  // fields the discovery sources don't structure themselves. Adzuna does
  // provide salary_min/max at discovery time (job.salary_min/max, set by
  // insertDiscoveredJobs) — only overwrite it here if extraction found
  // something and the job didn't already have it.
  const { error: jobUpdateError } = await supabase
    .from("jobs")
    .update({
      workplace_type: validated.data.workplaceType,
      salary_min: job.salary_min ?? validated.data.salaryMin,
      salary_max: job.salary_max ?? validated.data.salaryMax,
      salary_currency: validated.data.salaryCurrency,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .eq("user_id", user.id);

  if (jobUpdateError) return { error: jobUpdateError.message };

  const { error: requirementsError } = await supabase
    .from("job_requirements")
    .insert({
      job_id: jobId,
      user_id: user.id,
      responsibilities: validated.data.responsibilities,
      required_qualifications: validated.data.requiredQualifications,
      preferred_qualifications: validated.data.preferredQualifications,
      technologies: validated.data.technologies,
      experience_requirement: validated.data.experienceRequirement,
      education_requirement: validated.data.educationRequirement,
      keywords: validated.data.keywords,
    });

  if (requirementsError) return { error: requirementsError.message };

  revalidatePath("/jobs/discover");
  revalidatePath(`/jobs/${jobId}`);
  return {};
}
