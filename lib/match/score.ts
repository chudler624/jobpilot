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

export function scoreResumeRepresentation(
  matches: RequirementMatch[],
  skillEvidenceStrength: Map<string, string>,
  evidenceVerified: Map<string, boolean>
): number | null {
  const backed = matches.filter((m) => m.status !== "missing");
  if (backed.length === 0) return null;

  const wellEvidenced = backed.filter((m) => {
    if (m.matchedSkillId) {
      const strength = skillEvidenceStrength.get(m.matchedSkillId);
      return strength === "direct" || strength === "adjacent";
    }
    if (m.matchedEvidenceId) {
      return evidenceVerified.get(m.matchedEvidenceId) === true;
    }
    return false; // cited an experience/accomplishment with no evidence backing
  });

  return wellEvidenced.length / backed.length;
}

export function scoreRelevantExperience(
  matches: RequirementMatch[],
  experienceYears: Map<string, number>
): number {
  const totalYears = [...experienceYears.values()].reduce((sum, y) => sum + y, 0);
  if (totalYears === 0) return 0;

  const citedIds = new Set(
    matches.map((m) => m.matchedExperienceId).filter((id): id is string => id !== null)
  );
  const citedYears = [...citedIds].reduce(
    (sum, id) => sum + (experienceYears.get(id) ?? 0),
    0
  );

  return Math.min(citedYears / totalYears, 1);
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
