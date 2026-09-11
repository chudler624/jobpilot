import type { DimensionScores, Recommendation } from "./types";

// The only gate that can produce "skip" (see recommend() below). Exported
// so other features — e.g. Resume Engine's quality warning — can ask "is
// this the kind of job Match Engine would tell you to skip?" without
// duplicating the number or re-deriving the threshold independently.
export const SKIP_THRESHOLD = 0.4;

const WEIGHTS: Record<keyof DimensionScores, number> = {
  requiredSkills: 0.35,
  preferredSkills: 0.1,
  relevantExperience: 0.2,
  seniority: 0.15,
  industryDomain: 0.15,
  resumeRepresentation: 0.05,
};

export function weightedOverall(scores: DimensionScores): number {
  let weightSum = 0;
  let total = 0;
  for (const key of Object.keys(WEIGHTS) as (keyof DimensionScores)[]) {
    const score = scores[key];
    if (score === null) continue; // renormalize around only the dimensions we could compute
    total += score * WEIGHTS[key];
    weightSum += WEIGHTS[key];
  }
  return weightSum === 0 ? 0 : total / weightSum;
}

// Skip is reachable ONLY through the requiredSkills gate below — nothing
// else in this function can produce "skip". A job can score 0 on
// preferredSkills, industryDomain, seniority, and resumeRepresentation
// simultaneously and still land on "maybe" or better, as long as
// requiredSkills clears the gate. This is the concrete enforcement of
// "never hard-Skip on one missing preferred skill" (CLAUDE.md).
export function recommend(scores: DimensionScores): Recommendation {
  if (scores.requiredSkills < SKIP_THRESHOLD) return "skip";

  const overall = weightedOverall(scores);
  if (scores.requiredSkills >= 0.75 && overall >= 0.7) return "apply";
  if (scores.requiredSkills >= 0.5 && overall >= 0.5) return "apply_stretch";
  return "maybe";
}
