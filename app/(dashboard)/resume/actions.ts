"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai";
import {
  resumeContentPlanSchema,
  findFabricatedResumeCitation,
} from "@/lib/resume/schemas";
import { experienceHeaderText, projectHeaderText } from "@/lib/resume/header-text";
import type { ActionState } from "@/lib/career-profile/schemas";
import type { Database } from "@/types/supabase";

type SectionInsert = Database["public"]["Tables"]["resume_sections"]["Insert"];

export async function generateResume(
  jobId: string | null,
  _prevState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const [
    { data: skills },
    { data: experiences },
    { data: projects },
    { data: accomplishments },
    { data: evidenceRows },
  ] = await Promise.all([
    supabase.from("skills").select("*"),
    supabase.from("experiences").select("*"),
    supabase.from("projects").select("*"),
    supabase.from("accomplishments").select("*"),
    supabase.from("evidence").select("*"),
  ]);

  const skillRows = skills ?? [];
  const experienceRows = experiences ?? [];
  const projectRows = projects ?? [];
  const accomplishmentRows = accomplishments ?? [];
  const evidenceRowsList = evidenceRows ?? [];

  if (experienceRows.length === 0 && projectRows.length === 0) {
    return {
      error:
        "Add at least one experience or project to your Career Profile before generating a resume.",
    };
  }

  let job: { title: string | null; company: string | null } | null = null;
  let requirements: {
    required: string[];
    preferred: string[];
    technologies: string[];
  } | null = null;
  let matchContext:
    | { requirementText: string; status: string; rationale: string }[]
    | null = null;

  if (jobId) {
    const { data: jobRow } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();
    if (!jobRow) return { error: "Job not found" };
    job = { title: jobRow.title, company: jobRow.company };

    const { data: reqRow } = await supabase
      .from("job_requirements")
      .select("*")
      .eq("job_id", jobId)
      .maybeSingle();
    if (reqRow) {
      requirements = {
        required: reqRow.required_qualifications,
        preferred: reqRow.preferred_qualifications,
        technologies: reqRow.technologies,
      };
    }

    const { data: score } = await supabase
      .from("job_scores")
      .select("*")
      .eq("job_id", jobId)
      .maybeSingle();
    if (score) {
      const { data: matches } = await supabase
        .from("job_score_matches")
        .select("*")
        .eq("job_score_id", score.id);
      if (matches) {
        matchContext = matches.map((m) => ({
          requirementText: m.requirement_text,
          status: m.status,
          rationale: m.rationale,
        }));
      }
    }
  }

  let plan;
  try {
    const provider = getAIProvider();
    plan = await provider.generateResumeContent({
      job,
      requirements,
      matchContext,
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
        projects: projectRows.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          technologies: p.technologies,
        })),
        accomplishments: accomplishmentRows.map((a) => ({
          id: a.id,
          description: a.description,
          experienceId: a.experience_id,
          projectId: a.project_id,
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
  } catch (err) {
    console.error("generateResumeContent failed", err);
    return {
      error: "Couldn't generate resume content. Please try again in a moment.",
    };
  }

  const validated = resumeContentPlanSchema.safeParse(plan);
  if (!validated.success) {
    console.error(
      "resumeContentPlanSchema validation failed",
      JSON.stringify(validated.error.issues, null, 2),
      "raw plan:",
      JSON.stringify(plan, null, 2)
    );
    return {
      error: "The AI returned an unexpected format. Please try again.",
    };
  }

  const fabricated = findFabricatedResumeCitation(validated.data, {
    skills: new Set(skillRows.map((s) => s.id)),
    experiences: new Set(experienceRows.map((e) => e.id)),
    projects: new Set(projectRows.map((p) => p.id)),
    accomplishments: new Set(accomplishmentRows.map((a) => a.id)),
    evidence: new Set(evidenceRowsList.map((e) => e.id)),
  });
  if (fabricated) {
    return {
      error: "The AI cited a profile entry that doesn't exist. Please try again.",
    };
  }

  const sectionsToInsert: Omit<SectionInsert, "resume_version_id">[] = [];
  let orderIndex = 0;

  for (const claim of validated.data.summaryClaims) {
    sectionsToInsert.push({
      user_id: user.id,
      order_index: orderIndex++,
      section_type: "summary_claim",
      content_text: claim.text,
      matched_skill_id: claim.citedType === "skill" ? claim.citedId : null,
      matched_experience_id: claim.citedType === "experience" ? claim.citedId : null,
      matched_project_id: claim.citedType === "project" ? claim.citedId : null,
      matched_accomplishment_id:
        claim.citedType === "accomplishment" ? claim.citedId : null,
      matched_evidence_id: claim.citedType === "evidence" ? claim.citedId : null,
    });
  }

  for (const skillId of validated.data.includedSkillIds) {
    const skill = skillRows.find((s) => s.id === skillId);
    if (!skill) continue;
    sectionsToInsert.push({
      user_id: user.id,
      order_index: orderIndex++,
      section_type: "skill",
      content_text: skill.name,
      matched_skill_id: skillId,
      matched_experience_id: null,
      matched_project_id: null,
      matched_accomplishment_id: null,
      matched_evidence_id: null,
    });
  }

  for (const section of validated.data.experienceSections) {
    const experience = experienceRows.find((e) => e.id === section.experienceId);
    if (!experience) continue;
    sectionsToInsert.push({
      user_id: user.id,
      order_index: orderIndex++,
      section_type: "experience_header",
      content_text: experienceHeaderText(experience),
      matched_experience_id: experience.id,
      matched_project_id: null,
      matched_accomplishment_id: null,
      matched_evidence_id: null,
      matched_skill_id: null,
    });
    for (const bullet of section.bullets) {
      sectionsToInsert.push({
        user_id: user.id,
        order_index: orderIndex++,
        section_type: "experience_bullet",
        content_text: bullet.text,
        matched_skill_id: bullet.citedType === "skill" ? bullet.citedId : null,
        matched_experience_id:
          bullet.citedType === "experience" ? bullet.citedId : null,
        matched_project_id: bullet.citedType === "project" ? bullet.citedId : null,
        matched_accomplishment_id:
          bullet.citedType === "accomplishment" ? bullet.citedId : null,
        matched_evidence_id: bullet.citedType === "evidence" ? bullet.citedId : null,
      });
    }
  }

  for (const section of validated.data.projectSections) {
    const project = projectRows.find((p) => p.id === section.projectId);
    if (!project) continue;
    sectionsToInsert.push({
      user_id: user.id,
      order_index: orderIndex++,
      section_type: "project_header",
      content_text: projectHeaderText(project),
      matched_project_id: project.id,
      matched_experience_id: null,
      matched_accomplishment_id: null,
      matched_evidence_id: null,
      matched_skill_id: null,
    });
    for (const bullet of section.bullets) {
      sectionsToInsert.push({
        user_id: user.id,
        order_index: orderIndex++,
        section_type: "project_bullet",
        content_text: bullet.text,
        matched_skill_id: bullet.citedType === "skill" ? bullet.citedId : null,
        matched_experience_id:
          bullet.citedType === "experience" ? bullet.citedId : null,
        matched_project_id: bullet.citedType === "project" ? bullet.citedId : null,
        matched_accomplishment_id:
          bullet.citedType === "accomplishment" ? bullet.citedId : null,
        matched_evidence_id: bullet.citedType === "evidence" ? bullet.citedId : null,
      });
    }
  }

  if (sectionsToInsert.length === 0) {
    return {
      error:
        "The AI didn't generate any content. Try again, or add more to your Career Profile first.",
    };
  }

  const versionQuery = supabase
    .from("resume_versions")
    .select("version_number")
    .eq("user_id", user.id);
  const { data: existingVersions } = jobId
    ? await versionQuery.eq("job_id", jobId)
    : await versionQuery.is("job_id", null);
  const nextVersionNumber =
    Math.max(0, ...(existingVersions ?? []).map((v) => v.version_number)) + 1;

  const label = job
    ? `${job.company ?? "Unknown company"} — ${job.title ?? "Untitled role"}`
    : "Master Resume";

  const { data: version, error: versionError } = await supabase
    .from("resume_versions")
    .insert({
      user_id: user.id,
      job_id: jobId,
      label,
      version_number: nextVersionNumber,
    })
    .select("id")
    .single();

  if (versionError) return { error: versionError.message };

  const { error: sectionsError } = await supabase.from("resume_sections").insert(
    sectionsToInsert.map((section) => ({
      ...section,
      resume_version_id: version.id,
    }))
  );

  if (sectionsError) return { error: sectionsError.message };

  revalidatePath("/resume");
  if (jobId) revalidatePath(`/jobs/${jobId}`);
  redirect(`/resume/${version.id}`);
}

export async function deleteResumeVersion(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("resume_versions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/resume");
  redirect("/resume");
}
