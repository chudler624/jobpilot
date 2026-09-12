import { Badge } from "@/components/ui/badge";
import { VerifiedMarker } from "@/components/ui/verified-marker";
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
          <h3 className="text-[13px] font-medium text-muted-foreground">
            Summary
          </h3>
          <p>{summaryClaims.map((c) => c.content_text).join(" ")}</p>
        </div>
      )}

      {skills.length > 0 && (
        <div className="space-y-1.5">
          <h3 className="text-[13px] font-medium text-muted-foreground">
            Skills
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <Badge key={s.id} variant="outline">
                {s.content_text}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {experienceGroups.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[13px] font-medium text-muted-foreground">
            Experience
          </h3>
          {experienceGroups.map((group) => (
            <div key={group.header.id}>
              <p className="font-medium">{group.header.content_text}</p>
              <ul className="mt-1 flex flex-col gap-1">
                {group.bullets.map((b) => (
                  <li key={b.id} className="flex gap-2.5">
                    <VerifiedMarker verified={b.user_verified} className="mt-[7px]" />
                    <span className="flex-1">{b.content_text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {projectGroups.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[13px] font-medium text-muted-foreground">
            Projects
          </h3>
          {projectGroups.map((group) => (
            <div key={group.header.id}>
              <p className="font-medium">{group.header.content_text}</p>
              <ul className="mt-1 flex flex-col gap-1">
                {group.bullets.map((b) => (
                  <li key={b.id} className="flex gap-2.5">
                    <VerifiedMarker verified={b.user_verified} className="mt-[7px]" />
                    <span className="flex-1">{b.content_text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
