import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai";
import { jobExtractionResultSchema } from "@/lib/jobs/schemas";

export interface ExtractResult {
  error?: string;
}

// Shared by both entry points that can hit a job with no job_requirements
// row yet: the discover page's explicit "Extract & score" button, and
// analyzeMatch when it's invoked on a job that was never extracted first
// (e.g. navigated to directly from a discovery list instead of clicking
// through the per-job extract flow). Idempotent — a no-op if requirements
// already exist, so callers don't need to check first.
export async function ensureJobRequirements(
  jobId: string,
  userId: string
): Promise<ExtractResult> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("job_requirements")
    .select("id")
    .eq("job_id", jobId)
    .maybeSingle();
  if (existing) return {};

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", userId)
    .single();
  if (!job) return { error: "Job not found" };

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
  // fields the discovery sources don't structure themselves. Some sources
  // (Adzuna) do provide salary at discovery time — only overwrite it here
  // if the job didn't already have it.
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
    .eq("user_id", userId);

  if (jobUpdateError) return { error: jobUpdateError.message };

  const { error: requirementsError } = await supabase
    .from("job_requirements")
    .insert({
      job_id: jobId,
      user_id: userId,
      responsibilities: validated.data.responsibilities,
      required_qualifications: validated.data.requiredQualifications,
      preferred_qualifications: validated.data.preferredQualifications,
      technologies: validated.data.technologies,
      experience_requirement: validated.data.experienceRequirement,
      education_requirement: validated.data.educationRequirement,
      keywords: validated.data.keywords,
    });

  if (requirementsError) return { error: requirementsError.message };

  return {};
}
