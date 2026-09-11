import type { Database } from "@/types/supabase";

type ResumeSection = Database["public"]["Tables"]["resume_sections"]["Row"];

function citationKey(section: ResumeSection): string {
  return [
    section.matched_skill_id,
    section.matched_experience_id,
    section.matched_project_id,
    section.matched_accomplishment_id,
    section.matched_evidence_id,
  ].join("|");
}

export interface ResumeDiff {
  added: ResumeSection[];
  removed: ResumeSection[];
  reworded: { from: ResumeSection; to: ResumeSection }[];
}

// Structural diff, computed at render time — matches each row across the
// two versions by which Career Profile row it cites, not by text content,
// so a reworded bullet is recognized as "the same claim, different words"
// rather than as an unrelated add+remove.
export function diffResumeSections(
  master: ResumeSection[],
  tailored: ResumeSection[]
): ResumeDiff {
  const masterByKey = new Map(master.map((s) => [citationKey(s), s]));
  const tailoredByKey = new Map(tailored.map((s) => [citationKey(s), s]));

  const added: ResumeSection[] = [];
  const reworded: { from: ResumeSection; to: ResumeSection }[] = [];

  for (const [key, section] of tailoredByKey) {
    const masterSection = masterByKey.get(key);
    if (!masterSection) {
      added.push(section);
    } else if (masterSection.content_text !== section.content_text) {
      reworded.push({ from: masterSection, to: section });
    }
  }

  const removed: ResumeSection[] = [];
  for (const [key, section] of masterByKey) {
    if (!tailoredByKey.has(key)) removed.push(section);
  }

  return { added, removed, reworded };
}
