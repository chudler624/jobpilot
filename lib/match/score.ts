import type { RequirementMatch, DomainAssessment, MatchStatus } from "@/lib/ai";
import type { DimensionScores } from "./types";

export interface ScoringInput {
  matches: RequirementMatch[];
  domainAssessment: DomainAssessment;
  skillEvidenceStrength: Map<string, string>; // skillId -> evidence_strength
  evidenceVerified: Map<string, boolean>; // evidenceId -> verified
  experienceYears: Map<string, number>; // experienceId -> years contributed
  totalCareerYears: number;
  experienceRequirementText: string | null;
}

function statusPoints(status: MatchStatus): number {
  if (status === "strong") return 1;
  if (status === "partial") return 0.5;
  return 0;
}

export function scoreRequirementDimension(matches: RequirementMatch[]): number {
  if (matches.length === 0) return 1; // nothing required = nothing missing
  const points = matches.reduce((sum, m) => sum + statusPoints(m.status), 0);
  return points / matches.length;
}

// Shared "is this citation actually well-evidenced" rule — reused as-is by
// Resume Engine's Truth Guard (lib/resume/citation-detail.ts) so a claim's
// confidence badge always means the same thing here and there.
export function isCitationWellEvidenced(
  citation: { matchedSkillId?: string | null; matchedEvidenceId?: string | null },
  skillEvidenceStrength: Map<string, string>,
  evidenceVerified: Map<string, boolean>
): boolean {
  if (citation.matchedSkillId) {
    const strength = skillEvidenceStrength.get(citation.matchedSkillId);
    return strength === "direct" || strength === "adjacent";
  }
  if (citation.matchedEvidenceId) {
    return evidenceVerified.get(citation.matchedEvidenceId) === true;
  }
  return false; // cited an experience/project/accomplishment with no evidence backing
}

export function scoreResumeRepresentation(
  matches: RequirementMatch[],
  skillEvidenceStrength: Map<string, string>,
  evidenceVerified: Map<string, boolean>
): number | null {
  const backed = matches.filter((m) => m.status !== "missing");
  if (backed.length === 0) return null;

  const wellEvidenced = backed.filter((m) =>
    isCitationWellEvidenced(
      { matchedSkillId: m.matchedSkillId, matchedEvidenceId: m.matchedEvidenceId },
      skillEvidenceStrength,
      evidenceVerified
    )
  );

  return wellEvidenced.length / backed.length;
}

export function scoreRelevantExperience(
  matches: RequirementMatch[],
  experienceYears: Map<string, number>
): number {
  const totalYears = [...experienceYears.values()].reduce((sum, y) => sum + y, 0);
  if (totalYears === 0) return 0;

  // Weight each cited experience's years by the strongest match that cited
  // it (strong = full weight, partial = half) — a single partial citation
  // of someone's only experience row should not count as 100% relevant.
  const strengthByExperience = new Map<string, number>();
  for (const m of matches) {
    if (!m.matchedExperienceId) continue;
    const weight = statusPoints(m.status);
    const existing = strengthByExperience.get(m.matchedExperienceId) ?? 0;
    if (weight > existing) strengthByExperience.set(m.matchedExperienceId, weight);
  }

  const weightedCitedYears = [...strengthByExperience.entries()].reduce(
    (sum, [id, weight]) => sum + (experienceYears.get(id) ?? 0) * weight,
    0
  );

  return Math.min(weightedCitedYears / totalYears, 1);
}

export function parseMinYears(experienceRequirement: string | null): number | null {
  if (!experienceRequirement) return null;
  const match = experienceRequirement.match(/(\d+)\+?\s*years?/i);
  return match ? Number(match[1]) : null;
}

export function scoreSeniority(
  experienceRequirementText: string | null,
  totalCareerYears: number
): number | null {
  const required = parseMinYears(experienceRequirementText);
  if (required === null || required === 0) return null;
  return Math.min(totalCareerYears / required, 1);
}

export function scoreIndustryDomain(domainAssessment: DomainAssessment): number {
  return statusPoints(domainAssessment.status);
}

export function computeDimensionScores(input: ScoringInput): DimensionScores {
  return {
    requiredSkills: scoreRequirementDimension(
      input.matches.filter(
        (m) => m.requirementType === "required" || m.requirementType === "technology"
      )
    ),
    preferredSkills: scoreRequirementDimension(
      input.matches.filter((m) => m.requirementType === "preferred")
    ),
    relevantExperience: scoreRelevantExperience(input.matches, input.experienceYears),
    seniority: scoreSeniority(input.experienceRequirementText, input.totalCareerYears),
    industryDomain: scoreIndustryDomain(input.domainAssessment),
    resumeRepresentation: scoreResumeRepresentation(
      input.matches,
      input.skillEvidenceStrength,
      input.evidenceVerified
    ),
  };
}
