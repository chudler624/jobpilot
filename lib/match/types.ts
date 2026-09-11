export interface DimensionScores {
  requiredSkills: number;
  preferredSkills: number;
  relevantExperience: number;
  seniority: number | null;
  industryDomain: number;
  resumeRepresentation: number | null;
}

export type Recommendation = "apply" | "apply_stretch" | "maybe" | "skip";
