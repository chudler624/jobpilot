"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai";
import { fetchJobPageText } from "@/lib/jobs/fetch-job-page";
import {
  jobIntakeSchema,
  jobExtractionResultSchema,
  jobEditSchema,
} from "@/lib/jobs/schemas";
import { parseFormData, type ActionState } from "@/lib/career-profile/schemas";

export async function createJob(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseFormData(jobIntakeSchema, formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const sourceUrl = parsed.data.url ?? null;
  let rawDescription: string;

  if (sourceUrl) {
    const fetched = await fetchJobPageText(sourceUrl);
    if (!fetched.ok) return { error: fetched.error };
    rawDescription = fetched.text;
  } else {
    rawDescription = parsed.data.rawText!;
  }

  let extracted;
  try {
    const provider = getAIProvider();
    extracted = await provider.extractJobFields({ rawText: rawDescription });
  } catch {
    return {
      error:
        "Couldn't analyze this job posting. Please try again in a moment.",
    };
  }

  const validated = jobExtractionResultSchema.safeParse(extracted);
  if (!validated.success) {
    return {
      error: "The AI returned an unexpected format. Please try again.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .insert({
      user_id: user.id,
      source_url: sourceUrl,
      raw_description: rawDescription,
      company: validated.data.company,
      title: validated.data.title,
      location: validated.data.location,
      workplace_type: validated.data.workplaceType,
      salary_min: validated.data.salaryMin,
      salary_max: validated.data.salaryMax,
      salary_currency: validated.data.salaryCurrency,
    })
    .select("id")
    .single();

  if (jobError) return { error: jobError.message };

  const { error: requirementsError } = await supabase
    .from("job_requirements")
    .insert({
      job_id: job.id,
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

  revalidatePath("/jobs");
  redirect(`/jobs/${job.id}`);
}

export async function updateJob(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const result = parseFormData(jobEditSchema, formData);
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid job" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("jobs")
    .update({ ...result.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/jobs");
  redirect(`/jobs/${id}`);
}

export async function deleteJob(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("jobs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/jobs");
  redirect("/jobs");
}
