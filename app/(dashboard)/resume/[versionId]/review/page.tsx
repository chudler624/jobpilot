import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { VerifyCheckbox } from "@/components/resume/verify-checkbox";
import { GenerateResumeButton } from "@/components/resume/generate-resume-button";
import { createClient } from "@/lib/supabase/server";
import { groupByHeader } from "@/lib/resume/group-sections";
import { resolveCitation, type CareerProfileLookup } from "@/lib/resume/citation-detail";
import { finalizeResumeVersion } from "../../actions";
import type { Database } from "@/types/supabase";

type ResumeSection = Database["public"]["Tables"]["resume_sections"]["Row"];

function ClaimRow({
  section,
  versionId,
  profile,
}: {
  section: ResumeSection;
  versionId: string;
  profile: CareerProfileLookup;
}) {
  const citation = resolveCitation(section, profile);
  return (
    <li className="space-y-2 rounded-md border p-3 text-sm">
      <p>{section.content_text}</p>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Backed by: {citation.label}</span>
        <Badge variant={citation.confidence === "well-evidenced" ? "secondary" : "outline"}>
          {citation.confidence === "well-evidenced" ? "Well-evidenced" : "Thin evidence"}
        </Badge>
      </div>
      {citation.detail.length > 0 && (
        <div className="space-y-1 rounded-md bg-muted/50 p-2 text-xs">
          {citation.detail.map((d) => (
            <p key={d.heading}>
              <span className="font-medium">{d.heading}:</span> {d.body}
            </p>
          ))}
        </div>
      )}
      <VerifyCheckbox
        sectionId={section.id}
        versionId={versionId}
        initialVerified={section.user_verified}
      />
    </li>
  );
}

export default async function ResumeReviewPage({
  params,
}: {
  params: Promise<{ versionId: string }>;
}) {
  const { versionId } = await params;
  const supabase = await createClient();

  const { data: version } = await supabase
    .from("resume_versions")
    .select("*")
    .eq("id", versionId)
    .single();
  if (!version) notFound();

  const [
    { data: sections },
    { data: skills },
    { data: experiences },
    { data: projects },
    { data: accomplishments },
    { data: evidence },
  ] = await Promise.all([
    supabase
      .from("resume_sections")
      .select("*")
      .eq("resume_version_id", versionId)
      .order("order_index"),
    supabase.from("skills").select("*"),
    supabase.from("experiences").select("*"),
    supabase.from("projects").select("*"),
    supabase.from("accomplishments").select("*"),
    supabase.from("evidence").select("*"),
  ]);

  const sectionRows = sections ?? [];
  const profile: CareerProfileLookup = {
    skills: new Map((skills ?? []).map((s) => [s.id, s])),
    experiences: new Map((experiences ?? []).map((e) => [e.id, e])),
    projects: new Map((projects ?? []).map((p) => [p.id, p])),
    accomplishments: new Map((accomplishments ?? []).map((a) => [a.id, a])),
    evidence: new Map((evidence ?? []).map((e) => [e.id, e])),
  };

  const summaryClaims = sectionRows.filter((s) => s.section_type === "summary_claim");
  const skillSections = sectionRows.filter((s) => s.section_type === "skill");
  const experienceRows = sectionRows.filter(
    (s) => s.section_type === "experience_header" || s.section_type === "experience_bullet"
  );
  const projectRows = sectionRows.filter(
    (s) => s.section_type === "project_header" || s.section_type === "project_bullet"
  );
  const experienceGroups = groupByHeader(experienceRows, "experience_header");
  const projectGroups = groupByHeader(projectRows, "project_header");

  const total = sectionRows.length;
  const verifiedCount = sectionRows.filter((s) => s.user_verified).length;

  const citedSkillIds = new Set(
    sectionRows.map((s) => s.matched_skill_id).filter((id): id is string => id !== null)
  );
  const unrepresentedSkills = (skills ?? []).filter((s) => !citedSkillIds.has(s.id));

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Review — {version.label}</h1>
          <p className="text-muted-foreground">
            v{version.version_number} · {verifiedCount} of {total} claims verified
          </p>
        </div>
        <Link href={`/resume/${version.id}`} className={buttonVariants({ variant: "outline" })}>
          Back to resume
        </Link>
      </div>

      <div className="space-y-4">
        {summaryClaims.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {summaryClaims.map((s) => (
                  <ClaimRow key={s.id} section={s} versionId={version.id} profile={profile} />
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {skillSections.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {skillSections.map((s) => (
                  <ClaimRow key={s.id} section={s} versionId={version.id} profile={profile} />
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {experienceGroups.map((group) => (
          <Card key={group.header.id}>
            <CardHeader>
              <CardTitle className="text-base">{group.header.content_text}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <ClaimRow section={group.header} versionId={version.id} profile={profile} />
                {group.bullets.map((b) => (
                  <ClaimRow key={b.id} section={b} versionId={version.id} profile={profile} />
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}

        {projectGroups.map((group) => (
          <Card key={group.header.id}>
            <CardHeader>
              <CardTitle className="text-base">{group.header.content_text}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <ClaimRow section={group.header} versionId={version.id} profile={profile} />
                {group.bullets.map((b) => (
                  <ClaimRow key={b.id} section={b} versionId={version.id} profile={profile} />
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Skills not represented in this version</CardTitle>
        </CardHeader>
        <CardContent>
          {unrepresentedSkills.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Every skill in your Career Profile appears somewhere in this resume.
            </p>
          ) : (
            <ul className="space-y-1 text-sm">
              {unrepresentedSkills.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2">
                  <span>{s.name}</span>
                  <span className="text-xs text-muted-foreground">
                    You have this — evidence: {s.evidence_strength}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {version.status === "finalized" ? (
        <p className="text-sm text-muted-foreground">
          This resume version is finalized
          {version.finalized_at
            ? ` (${new Date(version.finalized_at).toLocaleDateString()})`
            : ""}
          .
        </p>
      ) : (
        <GenerateResumeButton
          action={finalizeResumeVersion.bind(null, version.id)}
          label="Finalize this resume"
          pendingLabel="Finalizing..."
        />
      )}
    </div>
  );
}
