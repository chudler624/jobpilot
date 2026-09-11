import * as derive from "../lib/answer-derivation";
import type { AnswerValue } from "../lib/answer-derivation";
import type { CareerProfile } from "../lib/career-profile";
import type { DetectedField } from "../lib/messages";

export interface ResolvedAnswer {
  display: string;
  fillValue: string;
}

function toResolved(answer: AnswerValue): ResolvedAnswer | null {
  switch (answer.kind) {
    case "text":
      return { display: answer.value, fillValue: answer.value };
    case "boolean":
      return { display: answer.value ? "Yes" : "No", fillValue: answer.value ? "Yes" : "No" };
    case "yearsOfExperience":
      return answer.tagged
        ? { display: `${answer.value} year${answer.value === 1 ? "" : "s"}`, fillValue: String(answer.value) }
        : {
            display: "0 years tagged (skill is recorded, but not linked to a specific experience)",
            fillValue: "0",
          };
    case "notFound":
      return null;
  }
}

export function resolveAnswer(field: DetectedField, profile: CareerProfile): ResolvedAnswer | null {
  switch (field.category) {
    case "firstName":
      return toResolved(derive.deriveFirstName(profile));
    case "lastName":
      return toResolved(derive.deriveLastName(profile));
    case "fullName":
      return toResolved(derive.deriveFullName(profile));
    case "email":
      return toResolved(derive.deriveEmail(profile));
    case "phone":
      return toResolved(derive.derivePhone(profile));
    case "workAuthorization":
      return toResolved(derive.deriveWorkAuthorization(profile));
    case "requiresSponsorship":
      return toResolved(derive.deriveRequiresSponsorship(profile));
    case "yearsOfExperience":
      return toResolved(derive.deriveYearsOfExperience(profile, field.technology));
    case "skillYesNo":
      return toResolved(derive.deriveSkillYesNo(profile, field.technology));
    case "unknown":
      return null;
  }
}

export const CATEGORY_LABELS: Record<DetectedField["category"], string> = {
  firstName: "First name",
  lastName: "Last name",
  fullName: "Full name",
  email: "Email",
  phone: "Phone",
  workAuthorization: "Work authorization",
  requiresSponsorship: "Requires sponsorship",
  yearsOfExperience: "Years of experience",
  skillYesNo: "Skill / experience check",
  unknown: "Unrecognized",
};
