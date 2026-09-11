import { isCitationWellEvidenced } from "@/lib/match/score";
import type { Database } from "@/types/supabase";

type ResumeSection = Database["public"]["Tables"]["resume_sections"]["Row"];
type Skill = Database["public"]["Tables"]["skills"]["Row"];
type Experience = Database["public"]["Tables"]["experiences"]["Row"];
type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type Accomplishment = Database["public"]["Tables"]["accomplishments"]["Row"];
type Evidence = Database["public"]["Tables"]["evidence"]["Row"];

export interface CareerProfileLookup {
  skills: Map<string, Skill>;
  experiences: Map<string, Experience>;
  projects: Map<string, ProjectRow>;
  accomplishments: Map<string, Accomplishment>;
  evidence: Map<string, Evidence>;
}

export type Confidence = "well-evidenced" | "thin";

export interface CitationDetail {
  label: string;
  confidence: Confidence;
  detail: { heading: string; body: string }[];
}

function evidenceDetail(ev: Evidence | undefined): { heading: string; body: string }[] {
  if (!ev) return [];
  return [
    { heading: "Problem", body: ev.problem },
    { heading: "Action", body: ev.action },
    { heading: "Result", body: ev.result },
  ];
}

// Resolves a resume_sections row's citation into a display label + evidence
// detail + confidence. Confidence reuses isCitationWellEvidenced (the exact
// rule Match Engine's resume_representation_score is built on) so a claim
// judged "well-evidenced" here means the same thing it means there.
export function resolveCitation(
  section: ResumeSection,
  profile: CareerProfileLookup
): CitationDetail {
  const skillEvidenceStrength = new Map(
    [...profile.skills.values()].map((s) => [s.id, s.evidence_strength])
  );
  const evidenceVerified = new Map(
    [...profile.evidence.values()].map((e) => [e.id, e.verified])
  );
  const wellEvidenced = (matchedSkillId: string | null, matchedEvidenceId: string | null) =>
    isCitationWellEvidenced(
      { matchedSkillId, matchedEvidenceId },
      skillEvidenceStrength,
      evidenceVerified
    )
      ? "well-evidenced"
      : "thin";

  if (section.matched_skill_id) {
    const skill = profile.skills.get(section.matched_skill_id);
    const linkedEvidence = skill?.evidence_id
      ? profile.evidence.get(skill.evidence_id)
      : undefined;
    return {
      label: `Skill — ${skill?.name ?? "Unknown"}`,
      confidence: wellEvidenced(section.matched_skill_id, null),
      detail: [
        { heading: "Evidence strength", body: skill?.evidence_strength ?? "none" },
        ...evidenceDetail(linkedEvidence),
      ],
    };
  }

  if (section.matched_evidence_id) {
    const ev = profile.evidence.get(section.matched_evidence_id);
    return {
      label: `Evidence — ${ev?.title ?? "Unknown"}`,
      confidence: wellEvidenced(null, section.matched_evidence_id),
      detail: evidenceDetail(ev),
    };
  }

  if (section.matched_experience_id) {
    const exp = profile.experiences.get(section.matched_experience_id);
    return {
      label: `Experience — ${exp ? `${exp.title} at ${exp.company}` : "Unknown"}`,
      confidence: "thin",
      detail: exp?.description ? [{ heading: "Description", body: exp.description }] : [],
    };
  }

  if (section.matched_project_id) {
    const proj = profile.projects.get(section.matched_project_id);
    return {
      label: `Project — ${proj?.name ?? "Unknown"}`,
      confidence: "thin",
      detail: proj?.description ? [{ heading: "Description", body: proj.description }] : [],
    };
  }

  if (section.matched_accomplishment_id) {
    const acc = profile.accomplishments.get(section.matched_accomplishment_id);
    return {
      label: "Accomplishment",
      confidence: "thin",
      detail: acc ? [{ heading: "Description", body: acc.description }] : [],
    };
  }

  return { label: "Unknown", confidence: "thin", detail: [] };
}
