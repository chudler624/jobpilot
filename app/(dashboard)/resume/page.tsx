import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GenerateResumeButton } from "@/components/resume/generate-resume-button";
import { createClient } from "@/lib/supabase/server";
import { generateResume } from "./actions";

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
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Resume</h1>
        <p className="text-muted-foreground">
          A code-driven, ATS-safe resume generated from your Career Profile
          — a general-purpose Master Resume, plus versions tailored to
          specific jobs.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Master Resume</h2>
        {master ? (
          <Link href={`/resume/${master.id}`}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle>
                  {master.label} (v{master.version_number})
                </CardTitle>
                <CardDescription>
                  Generated {new Date(master.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground">
            No Master Resume yet.
          </p>
        )}
        <GenerateResumeButton
          action={generateResume.bind(null, null)}
          label={master ? "Regenerate Master Resume" : "Generate Master Resume"}
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Tailored versions</h2>
        {tailored.length === 0 && (
          <p className="text-sm text-muted-foreground">
            None yet — generate one from a job&apos;s detail page.
          </p>
        )}
        <div className="grid gap-3">
          {tailored.map((version) => {
            const job = version.job_id ? jobLookup.get(version.job_id) : null;
            return (
              <Link key={version.id} href={`/resume/${version.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <CardTitle>
                      {version.label} (v{version.version_number})
                    </CardTitle>
                    <CardDescription>
                      {job
                        ? `${job.title ?? "Untitled role"} at ${job.company ?? "Unknown company"}`
                        : "Job no longer exists"}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
