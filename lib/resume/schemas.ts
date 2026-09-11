import { z } from "zod";
import type { ResumeContentPlan } from "@/lib/ai";

export const resumeClaimSchema = z.object({
  text: z.string().trim().min(1),
  citedType: z.enum(["experience", "project", "accomplishment", "evidence", "skill"]),
  citedId: z.string().min(1),
});

export const resumeContentPlanSchema = z.object({
  summaryClaims: z.array(resumeClaimSchema),
  includedSkillIds: z.array(z.string()),
  experienceSections: z.array(
    z.object({
      experienceId: z.string(),
      bullets: z.array(resumeClaimSchema),
    })
  ),
  projectSections: z.array(
    z.object({
      projectId: z.string(),
      bullets: z.array(resumeClaimSchema),
    })
  ),
});

export interface ResumeProfileIdSets {
  skills: Set<string>;
  experiences: Set<string>;
  projects: Set<string>;
  accomplishments: Set<string>;
  evidence: Set<string>;
}

function idSetFor(
  type: string,
  validIds: ResumeProfileIdSets
): Set<string> {
  switch (type) {
    case "skill":
      return validIds.skills;
    case "experience":
      return validIds.experiences;
    case "project":
      return validIds.projects;
    case "accomplishment":
      return validIds.accomplishments;
    case "evidence":
      return validIds.evidence;
    default:
      return new Set();
  }
}

// Same discipline as lib/match/schemas.ts's findFabricatedCitation,
// extended to 5 citation types since resume content can cite any Career
// Profile entity, not just the 4 Match Engine uses.
export function findFabricatedResumeCitation(
  plan: z.infer<typeof resumeContentPlanSchema>,
  validIds: ResumeProfileIdSets
): string | null {
  const allClaims = [
    ...plan.summaryClaims,
    ...plan.experienceSections.flatMap((s) => s.bullets),
    ...plan.projectSections.flatMap((s) => s.bullets),
  ];

  for (const claim of allClaims) {
    if (!idSetFor(claim.citedType, validIds).has(claim.citedId)) {
      return claim.citedId;
    }
  }
  for (const id of plan.includedSkillIds) {
    if (!validIds.skills.has(id)) return id;
  }
  for (const section of plan.experienceSections) {
    if (!validIds.experiences.has(section.experienceId)) {
      return section.experienceId;
    }
  }
  for (const section of plan.projectSections) {
    if (!validIds.projects.has(section.projectId)) {
      return section.projectId;
    }
  }
  return null;
}

export type { ResumeContentPlan };
