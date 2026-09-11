import type { Database } from "@/types/supabase";

type ResumeSection = Database["public"]["Tables"]["resume_sections"]["Row"];

export interface HeaderGroup {
  header: ResumeSection;
  bullets: ResumeSection[];
}

// Sections have no explicit parent_id — a header row starts a new group
// and subsequent rows belong to it until the next header, same sequential
// convention lib/resume/template.ts relies on when building the docx.
export function groupByHeader(
  rows: ResumeSection[],
  headerType: ResumeSection["section_type"]
): HeaderGroup[] {
  const groups: HeaderGroup[] = [];
  for (const row of rows) {
    if (row.section_type === headerType) {
      groups.push({ header: row, bullets: [] });
    } else if (groups.length > 0) {
      groups[groups.length - 1].bullets.push(row);
    }
  }
  return groups;
}
