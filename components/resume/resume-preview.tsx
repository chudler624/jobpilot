import { Badge } from "@/components/ui/badge";
import { groupByHeader } from "@/lib/resume/group-sections";
import type { Database } from "@/types/supabase";

type ResumeSection = Database["public"]["Tables"]["resume_sections"]["Row"];

// Mirrors lib/resume/template.ts's grouping so the in-app preview reads
// like the actual resume (one summary paragraph, comma/badge-grouped
// skills, bullets under their headers) instead of a flat row dump.
export function ResumePreview({ sections }: { sections: ResumeSection[] }) {
  const summaryClaims = sections.filter((s) => s.section_type === "summary_claim");
  const skills = sections.filter((s) => s.section_type === "skill");
  const experienceRows = sections.filter(
    (s) => s.section_type === "experience_header" || s.section_type === "experience_bullet"
  );
  const projectRows = sections.filter(
    (s) => s.section_type === "project_header" || s.section_type === "project_bullet"
  );

  const experienceGroups = groupByHeader(experienceRows, "experience_header");
  const projectGroups = groupByHeader(projectRows, "project_header");

  return (
    <div className="space-y-5 text-sm">
      {summaryClaims.length > 0 && (
        <div className="space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Summary
          </h3>
          <p>{summaryClaims.map((c) => c.content_text).join(" ")}</p>
        </div>
      )}

      {skills.length > 0 && (
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Skills
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <Badge key={s.id} variant="secondary">
                {s.content_text}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {experienceGroups.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Experience
          </h3>
          {experienceGroups.map((group) => (
            <div key={group.header.id}>
              <p className="font-medium">{group.header.content_text}</p>
              <ul className="list-inside list-disc text-muted-foreground">
                {group.bullets.map((b) => (
                  <li key={b.id}>{b.content_text}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {projectGroups.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Projects
          </h3>
          {projectGroups.map((group) => (
            <div key={group.header.id}>
              <p className="font-medium">{group.header.content_text}</p>
              <ul className="list-inside list-disc text-muted-foreground">
                {group.bullets.map((b) => (
                  <li key={b.id}>{b.content_text}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
