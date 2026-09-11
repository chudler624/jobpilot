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
import {
  jobMatchMappingSchema,
  findFabricatedCitation,
} from "@/lib/match/schemas";
import { computeDimensionScores } from "@/lib/match/score";
import { recommend, weightedOverall } from "@/lib/match/recommend";
import { computeExperienceYears } from "@/lib/match/experience-years";

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

export async function analyzeMatch(
  jobId: string,
  _prevState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const [
    { data: job },
    { data: requirements },
    { data: skills },
    { data: experiences },
    { data: accomplishments },
    { data: evidenceRows },
  ] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", jobId).single(),
    supabase.from("job_requirements").select("*").eq("job_id", jobId).single(),
    supabase.from("skills").select("*"),
    supabase.from("experiences").select("*"),
    supabase.from("accomplishments").select("*"),
    supabase.from("evidence").select("*"),
  ]);

  if (!job || !requirements) {
    return { error: "This job hasn't been analyzed yet" };
  }

  const skillRows = skills ?? [];
  const experienceRows = experiences ?? [];
  const accomplishmentRows = accomplishments ?? [];
  const evidenceRowsList = evidenceRows ?? [];

  let mapping;
  try {
    const provider = getAIProvider();
    mapping = await provider.mapJobRequirements({
      job: { title: job.title, location: job.location },
      requirements: {
        required: requirements.required_qualifications,
        preferred: requirements.preferred_qualifications,
        technologies: requirements.technologies,
      },
      careerProfile: {
        skills: skillRows.map((s) => ({
          id: s.id,
          name: s.name,
          evidenceStrength: s.evidence_strength,
        })),
        experiences: experienceRows.map((e) => ({
          id: e.id,
          company: e.company,
          title: e.title,
          technologies: e.technologies,
          description: e.description,
        })),
        accomplishments: accomplishmentRows.map((a) => ({
          id: a.id,
          description: a.description,
        })),
        evidence: evidenceRowsList.map((ev) => ({
          id: ev.id,
          title: ev.title,
          problem: ev.problem,
          action: ev.action,
          result: ev.result,
        })),
      },
    });
  } catch {
    return {
      error: "Couldn't analyze this match. Please try again in a moment.",
    };
  }

  const validated = jobMatchMappingSchema.safeParse(mapping);
  if (!validated.success) {
    return {
      error: "The AI returned an unexpected format. Please try again.",
    };
  }

  const fabricated = findFabricatedCitation(validated.data, {
    skills: new Set(skillRows.map((s) => s.id)),
    experiences: new Set(experienceRows.map((e) => e.id)),
    accomplishments: new Set(accomplishmentRows.map((a) => a.id)),
    evidence: new Set(evidenceRowsList.map((e) => e.id)),
  });
  if (fabricated) {
    return {
      error: "The AI cited a profile entry that doesn't exist. Please try again.",
    };
  }

  const experienceYears = new Map(
    experienceRows.map((e) => [e.id, computeExperienceYears(e.start_date, e.end_date)])
  );
  const totalCareerYears = [...experienceYears.values()].reduce(
    (sum, y) => sum + y,
    0
  );
  const skillEvidenceStrength = new Map(
    skillRows.map((s) => [s.id, s.evidence_strength])
  );
  const evidenceVerified = new Map(
    evidenceRowsList.map((e) => [e.id, e.verified])
  );

  const dimensions = computeDimensionScores({
    matches: validated.data.matches,
    domainAssessment: validated.data.domainAssessment,
    skillEvidenceStrength,
    evidenceVerified,
    experienceYears,
    totalCareerYears,
    experienceRequirementText: requirements.experience_requirement,
  });

  const overall = weightedOverall(dimensions);
  const recommendation = recommend(dimensions);

  // Re-analyzing replaces the previous score; job_score_matches cascades
  // with it, so no separate delete is needed for the trace rows.
  await supabase.from("job_scores").delete().eq("job_id", jobId).eq("user_id", user.id);

  const { data: scoreRow, error: scoreError } = await supabase
    .from("job_scores")
    .insert({
      user_id: user.id,
      job_id: jobId,
      required_skills_score: dimensions.requiredSkills,
      preferred_skills_score: dimensions.preferredSkills,
      relevant_experience_score: dimensions.relevantExperience,
      seniority_score: dimensions.seniority,
      industry_domain_score: dimensions.industryDomain,
      resume_representation_score: dimensions.resumeRepresentation,
      overall_score: overall,
      recommendation,
    })
    .select("id")
    .single();

  if (scoreError) return { error: scoreError.message };

  const matchRows = validated.data.matches.map((m) => ({
    user_id: user.id,
    job_score_id: scoreRow.id,
    requirement_text: m.requirementText,
    requirement_type: m.requirementType,
    status: m.status,
    matched_skill_id: m.matchedSkillId,
    matched_experience_id: m.matchedExperienceId,
    matched_accomplishment_id: m.matchedAccomplishmentId,
    matched_evidence_id: m.matchedEvidenceId,
    rationale: m.rationale,
  }));

  const domainRows =
    validated.data.domainAssessment.matchedExperienceIds.length > 0
      ? validated.data.domainAssessment.matchedExperienceIds.map((expId) => ({
          user_id: user.id,
          job_score_id: scoreRow.id,
          requirement_text: "Industry/domain fit",
          requirement_type: "domain" as const,
          status: validated.data.domainAssessment.status,
          matched_skill_id: null,
          matched_experience_id: expId,
          matched_accomplishment_id: null,
          matched_evidence_id: null,
          rationale: validated.data.domainAssessment.rationale,
        }))
      : [
          {
            user_id: user.id,
            job_score_id: scoreRow.id,
            requirement_text: "Industry/domain fit",
            requirement_type: "domain" as const,
            status: "missing" as const,
            matched_skill_id: null,
            matched_experience_id: null,
            matched_accomplishment_id: null,
            matched_evidence_id: null,
            rationale: validated.data.domainAssessment.rationale,
          },
        ];

  const { error: matchesError } = await supabase
    .from("job_score_matches")
    .insert([...matchRows, ...domainRows]);

  if (matchesError) return { error: matchesError.message };

  revalidatePath(`/jobs/${jobId}`);
  return {};
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
