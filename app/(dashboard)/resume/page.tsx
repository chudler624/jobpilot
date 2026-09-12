import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GenerateResumeButton } from "@/components/resume/generate-resume-button";
import { createClient } from "@/lib/supabase/server";
import { generateResume } from "./actions";

function isoDate(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function StatusBadge({ status }: { status: "draft" | "finalized" }) {
  return status === "finalized" ? (
    <Badge variant="outline" marker="verified">
      Finalized
    </Badge>
  ) : (
    <Badge variant="secondary" marker="unverified">
      Draft
    </Badge>
  );
}

export default async function ResumePage() {
  const supabase = await createClient();
  const [{ data: versions }, { data: jobs }] = await Promise.all([
    supabase
      .from("resume_versions")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("jobs").select("id, title, company"),
  ]);

  const jobLookup = new Map((jobs ?? []).map((j) => [j.id, j]));
  const allVersions = versions ?? [];
  const master = allVersions
    .filter((v) => v.job_id === null)
    .sort((a, b) => b.version_number - a.version_number)[0];
  const tailored = allVersions.filter((v) => v.job_id !== null);

  return (
    <div className="max-w-[820px]">
      <h1 className="text-[26px] leading-tight font-medium">Resume</h1>
      <p className="mt-1 text-[15px] text-muted-foreground">
        A code-driven, ATS-safe resume generated from your Career Profile — a
        general-purpose Master Resume, plus versions tailored to specific jobs.
      </p>

      <h2 className="mt-9 mb-3 text-base font-medium">Master Resume</h2>
      <div className="flex flex-col gap-3">
        {master ? (
          <Link href={`/resume/${master.id}`}>
            <Card className="flex-row items-center justify-between gap-4 px-[18px] transition-colors hover:bg-secondary">
              <div className="min-w-0">
                <div className="text-base font-medium">
                  {master.label}
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    · v{master.version_number}
                  </span>
                </div>
                <div className="mt-[3px] text-[13.5px] text-muted-foreground">
                  Generated{" "}
                  <span className="font-mono tabular">
                    {isoDate(master.created_at)}
                  </span>
                </div>
              </div>
              <StatusBadge status={master.status} />
            </Card>
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground">No Master Resume yet.</p>
        )}
        <div>
          <GenerateResumeButton
            action={generateResume.bind(null, null)}
            label={master ? "Regenerate Master Resume" : "Generate Master Resume"}
            variant="outline"
          />
        </div>
      </div>

      <h2 className="mt-9 mb-3 text-base font-medium">Tailored versions</h2>
      <div className="flex flex-col gap-3">
        {tailored.length === 0 && (
          <p className="text-sm text-muted-foreground">
            None yet — generate one from a job&apos;s detail page.
          </p>
        )}
        {tailored.map((version) => {
          const job = version.job_id ? jobLookup.get(version.job_id) : null;
          return (
            <Link key={version.id} href={`/resume/${version.id}`}>
              <Card className="flex-row items-center justify-between gap-4 px-[18px] transition-colors hover:bg-secondary">
                <div className="min-w-0">
                  <div className="text-base font-medium">
                    {version.label}
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      · v{version.version_number}
                    </span>
                  </div>
                  <div className="mt-[3px] text-[13.5px] text-muted-foreground">
                    {job
                      ? `${job.title ?? "Untitled role"} at ${job.company ?? "Unknown company"}`
                      : "Job no longer exists"}
                  </div>
                </div>
                <StatusBadge status={version.status} />
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
