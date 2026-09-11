import { z } from "zod";
import type { JobMatchMapping } from "@/lib/ai";

function citationCount(data: {
  matchedSkillId: string | null;
  matchedExperienceId: string | null;
  matchedAccomplishmentId: string | null;
  matchedEvidenceId: string | null;
}) {
  return [
    data.matchedSkillId,
    data.matchedExperienceId,
    data.matchedAccomplishmentId,
    data.matchedEvidenceId,
  ].filter((id) => id !== null).length;
}

// Mirrors the DB check constraint on job_score_matches — validating this
// before the insert means an AI response that doesn't comply surfaces as a
// clean inline error, not a raw Postgres constraint violation.
export const requirementMatchSchema = z
  .object({
    requirementText: z.string(),
    requirementType: z.enum(["required", "preferred", "technology"]),
    status: z.enum(["strong", "partial", "missing"]),
    matchedSkillId: z.string().nullable(),
    matchedExperienceId: z.string().nullable(),
    matchedAccomplishmentId: z.string().nullable(),
    matchedEvidenceId: z.string().nullable(),
    rationale: z.string(),
  })
  .superRefine((data, ctx) => {
    const count = citationCount(data);
    if (data.status === "missing" && count !== 0) {
      ctx.addIssue({
        code: "custom",
        message: "A missing match must not cite a profile row",
      });
    }
    if (data.status !== "missing" && count !== 1) {
      ctx.addIssue({
        code: "custom",
        message: "A strong/partial match must cite exactly one profile row",
      });
    }
  });

export const domainAssessmentSchema = z
  .object({
    status: z.enum(["strong", "partial", "missing"]),
    matchedExperienceIds: z.array(z.string()),
    rationale: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "missing" && data.matchedExperienceIds.length !== 0) {
      ctx.addIssue({
        code: "custom",
        message: "A missing domain assessment must not cite experiences",
      });
    }
    if (data.status !== "missing" && data.matchedExperienceIds.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "A non-missing domain assessment must cite at least one experience",
      });
    }
  });

export const jobMatchMappingSchema = z.object({
  matches: z.array(requirementMatchSchema),
  domainAssessment: domainAssessmentSchema,
});

export interface ProfileIdSets {
  skills: Set<string>;
  experiences: Set<string>;
  accomplishments: Set<string>;
  evidence: Set<string>;
}

// Structural validity doesn't guarantee the model didn't invent an id that
// wasn't in the profile it was given — check that separately.
export function findFabricatedCitation(
  mapping: JobMatchMapping,
  validIds: ProfileIdSets
): string | null {
  for (const m of mapping.matches) {
    if (m.matchedSkillId && !validIds.skills.has(m.matchedSkillId)) {
      return m.matchedSkillId;
    }
    if (m.matchedExperienceId && !validIds.experiences.has(m.matchedExperienceId)) {
      return m.matchedExperienceId;
    }
    if (
      m.matchedAccomplishmentId &&
      !validIds.accomplishments.has(m.matchedAccomplishmentId)
    ) {
      return m.matchedAccomplishmentId;
    }
    if (m.matchedEvidenceId && !validIds.evidence.has(m.matchedEvidenceId)) {
      return m.matchedEvidenceId;
    }
  }
  for (const id of mapping.domainAssessment.matchedExperienceIds) {
    if (!validIds.experiences.has(id)) return id;
  }
  return null;
}
