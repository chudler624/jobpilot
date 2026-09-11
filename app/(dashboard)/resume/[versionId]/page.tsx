import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { ResumePreview } from "@/components/resume/resume-preview";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { diffResumeSections } from "@/lib/resume/compare";
import { SKIP_THRESHOLD } from "@/lib/match/recommend";
import { deleteResumeVersion } from "../actions";

export default async function ResumeVersionPage({
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

  const { data: sections } = await supabase
    .from("resume_sections")
    .select("*")
    .eq("resume_version_id", versionId)
    .order("order_index");

  let job: { title: string | null; company: string | null } | null = null;
  let weakMatchScore: number | null = null;
  if (version.job_id) {
    const { data: jobRow } = await supabase
      .from("jobs")
      .select("title, company")
      .eq("id", version.job_id)
      .single();
    job = jobRow;

    const { data: score } = await supabase
      .from("job_scores")
      .select("required_skills_score")
      .eq("job_id", version.job_id)
      .maybeSingle();
    if (score && score.required_skills_score < SKIP_THRESHOLD) {
      weakMatchScore = score.required_skills_score;
    }
  }

  let diff: ReturnType<typeof diffResumeSections> | null = null;
  if (version.job_id) {
    const { data: masterVersions } = await supabase
      .from("resume_versions")
      .select("*")
      .is("job_id", null)
      .order("version_number", { ascending: false })
      .limit(1);
    const master = masterVersions?.[0];
    if (master) {
      const { data: masterSections } = await supabase
        .from("resume_sections")
        .select("*")
        .eq("resume_version_id", master.id)
        .order("order_index");
      diff = diffResumeSections(masterSections ?? [], sections ?? []);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{version.label}</h1>
            <Badge variant={version.status === "finalized" ? "secondary" : "outline"}>
              {version.status === "finalized" ? "Finalized" : "Draft"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            v{version.version_number}
            {job
              ? ` · ${job.title ?? "Untitled role"} at ${job.company ?? "Unknown company"}`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/resume/${version.id}/review`}
            className={buttonVariants({ variant: "outline" })}
          >
            Review &amp; finalize
          </Link>
          <a
            href={`/resume/${version.id}/download`}
            className={buttonVariants()}
          >
            Download DOCX
          </a>
        </div>
      </div>

      {weakMatchScore !== null && (
        <p className="text-sm text-destructive">
          This job&apos;s required-skills match is only{" "}
          {Math.round(weakMatchScore * 100)}% — treat this resume&apos;s
          relevance with that in mind.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResumePreview sections={sections ?? []} />
        </CardContent>
      </Card>

      {diff && (
        <Card>
          <CardHeader>
            <CardTitle>What changed vs. Master Resume</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {diff.added.length > 0 && (
              <div>
                <h3 className="text-sm font-medium">Added</h3>
                <ul className="list-inside list-disc text-sm text-muted-foreground">
                  {diff.added.map((s) => (
                    <li key={s.id}>{s.content_text}</li>
                  ))}
                </ul>
              </div>
            )}
            {diff.removed.length > 0 && (
              <div>
                <h3 className="text-sm font-medium">
                  Removed (present in Master, not here)
                </h3>
                <ul className="list-inside list-disc text-sm text-muted-foreground">
                  {diff.removed.map((s) => (
                    <li key={s.id}>{s.content_text}</li>
                  ))}
                </ul>
              </div>
            )}
            {diff.reworded.length > 0 && (
              <div>
                <h3 className="text-sm font-medium">Reworded</h3>
                <ul className="space-y-2 text-sm">
                  {diff.reworded.map((r) => (
                    <li key={r.to.id}>
                      <p className="text-muted-foreground line-through">
                        {r.from.content_text}
                      </p>
                      <p>{r.to.content_text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {diff.added.length === 0 &&
              diff.removed.length === 0 &&
              diff.reworded.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No differences from the Master Resume.
                </p>
              )}
          </CardContent>
        </Card>
      )}

      <form action={deleteResumeVersion.bind(null, version.id)}>
        <ConfirmSubmitButton confirmMessage="Delete this resume version?">
          Delete
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
