import { computeExperienceYears } from "../../../lib/match/experience-years";
import type { CareerProfile } from "./career-profile";

export type AnswerValue =
  | { kind: "text"; value: string }
  | { kind: "yearsOfExperience"; value: number; tagged: boolean }
  | { kind: "boolean"; value: boolean }
  | { kind: "notFound" };

// Best-effort split of a single freeform display_name into first/last —
// heuristic, always shown for user review before filling, never presented
// as a verified fact the way the derived numbers below are.
function splitDisplayName(displayName: string | null): { first: string | null; last: string | null } {
  if (!displayName) return { first: null, last: null };
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: null };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export function deriveFirstName(profile: CareerProfile): AnswerValue {
  const { first } = splitDisplayName(profile.profile?.display_name ?? null);
  return first ? { kind: "text", value: first } : { kind: "notFound" };
}

export function deriveLastName(profile: CareerProfile): AnswerValue {
  const { last } = splitDisplayName(profile.profile?.display_name ?? null);
  return last ? { kind: "text", value: last } : { kind: "notFound" };
}

export function deriveFullName(profile: CareerProfile): AnswerValue {
  const name = profile.profile?.display_name;
  return name ? { kind: "text", value: name } : { kind: "notFound" };
}

export function deriveEmail(profile: CareerProfile): AnswerValue {
  const email = profile.profile?.email;
  return email ? { kind: "text", value: email } : { kind: "notFound" };
}

export function derivePhone(profile: CareerProfile): AnswerValue {
  const phone = profile.profile?.phone;
  return phone ? { kind: "text", value: phone } : { kind: "notFound" };
}

export function deriveWorkAuthorization(profile: CareerProfile): AnswerValue {
  const status = profile.profile?.work_authorization_status;
  return status ? { kind: "text", value: status } : { kind: "notFound" };
}

export function deriveRequiresSponsorship(profile: CareerProfile): AnswerValue {
  const value = profile.profile?.requires_sponsorship;
  return value === null || value === undefined
    ? { kind: "notFound" }
    : { kind: "boolean", value };
}

// Computed from real experiences date ranges, never inferred — same
// helper Match Engine uses for totalCareerYears (lib/match/experience-years.ts).
export function deriveYearsOfExperience(
  profile: CareerProfile,
  technology: string | null
): AnswerValue {
  if (!technology) {
    const total = profile.experiences.reduce(
      (sum, e) => sum + computeExperienceYears(e.start_date, e.end_date),
      0
    );
    return { kind: "yearsOfExperience", value: Math.round(total * 10) / 10, tagged: true };
  }

  const needle = technology.toLowerCase();
  const tagged = profile.experiences.filter((e) =>
    e.technologies.some((t) => t.toLowerCase() === needle)
  );

  if (tagged.length > 0) {
    const years = tagged.reduce(
      (sum, e) => sum + computeExperienceYears(e.start_date, e.end_date),
      0
    );
    return { kind: "yearsOfExperience", value: Math.round(years * 10) / 10, tagged: true };
  }

  // Not tagged on any experience — but check whether the skill exists at
  // all, so "0 years tagged" reads differently from "you don't have this
  // skill" (the same have-it-but-not-represented distinction Truth Guard
  // already makes for resumes).
  const skillExists = profile.skills.some((s) => s.name.toLowerCase() === needle);
  if (!skillExists) return { kind: "notFound" };
  return { kind: "yearsOfExperience", value: 0, tagged: false };
}

// "Yes" means the skill is recorded at all — existence, not resume-worthy
// evidence strength, is the question being asked.
export function deriveSkillYesNo(profile: CareerProfile, technology: string | null): AnswerValue {
  if (!technology) return { kind: "notFound" };
  const needle = technology.toLowerCase();
  const has = profile.skills.some((s) => s.name.toLowerCase() === needle);
  return { kind: "boolean", value: has };
}
