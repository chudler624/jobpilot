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
import { VerifiedMarker } from "@/components/ui/verified-marker";
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
  const wellEvidenced = citation.confidence === "well-evidenced";
  return (
    <li className="flex gap-3 border-b border-border py-3 last:border-b-0">
      <VerifiedMarker verified={section.user_verified} className="mt-1.5" />
      <div className="min-w-0 flex-1">
        <p
          className={
            section.user_verified
              ? "text-[14.5px] leading-normal"
              : "text-[14.5px] leading-normal text-muted-foreground"
          }
        >
          {section.content_text}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-4">
          <details className="group/ev">
            <summary className="cursor-pointer list-none text-[13px] text-primary [&::-webkit-details-marker]:hidden">
              <span className="group-open/ev:hidden">Why is this here?</span>
              <span className="hidden group-open/ev:inline">Hide evidence</span>
            </summary>
            <div className="mt-2.5 rounded-lg border border-border bg-secondary px-3.5 py-3 text-[13.5px] leading-[1.55]">
              <p className="flex flex-wrap items-center gap-2">
                <span>Backed by: {citation.label}</span>
                <Badge
                  variant={wellEvidenced ? "outline" : "secondary"}
                  marker={wellEvidenced ? "verified" : "unverified"}
                >
                  {wellEvidenced ? "Well-evidenced" : "Thin evidence"}
                </Badge>
              </p>
              {citation.detail.map((d) => (
                <p key={d.heading} className="mt-1.5">
                  <span className="font-medium">{d.heading}:</span> {d.body}
                </p>
              ))}
            </div>
          </details>

          <VerifyCheckbox
            sectionId={section.id}
            versionId={versionId}
            initialVerified={section.user_verified}
          />
        </div>
      </div>
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

  const allVerified = total > 0 && verifiedCount === total;

  return (
    <div className="max-w-[820px] space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div>
          <h1 className="text-[26px] leading-tight font-medium">
            Review — {version.label}
          </h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            v{version.version_number} · every claim traces to real evidence
            before you finalize.
          </p>
        </div>
        <Link
          href={`/resume/${version.id}`}
          className={buttonVariants({ variant: "outline" })}
        >
          Back to resume
        </Link>
      </div>

      <Card className="mt-7 items-start gap-3 px-[18px] py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <span className="text-sm text-muted-foreground">
          <span className="font-mono font-medium text-foreground tabular">
            {verifiedCount}
          </span>{" "}
          of{" "}
          <span className="font-mono font-medium text-foreground tabular">
            {total}
          </span>{" "}
          claims verified
        </span>
        <div className="flex flex-wrap items-center gap-3">
          {version.status === "finalized" ? (
            <Badge variant="outline" marker="verified">
              Finalized
            </Badge>
          ) : (
            <>
              {!allVerified && (
                <span className="text-[13px] text-muted-foreground">
                  Finalize is blocked until every claim is checked.
                </span>
              )}
              <GenerateResumeButton
                action={finalizeResumeVersion.bind(null, version.id)}
                label="Finalize"
                pendingLabel="Finalizing..."
                disabled={!allVerified}
              />
            </>
          )}
        </div>
      </Card>

      <div className="space-y-4">
        {summaryClaims.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <ul>
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
              <ul>
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
              <ul>
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
              <ul>
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
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2">
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

      {version.status === "finalized" && version.finalized_at && (
        <p className="text-[13px] text-muted-foreground">
          Finalized{" "}
          <span className="font-mono tabular">
            {new Date(version.finalized_at).toISOString().slice(0, 10)}
          </span>
          .
        </p>
      )}
    </div>
  );
}
