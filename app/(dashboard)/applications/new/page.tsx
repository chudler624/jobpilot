import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GenerateResumeButton } from "@/components/resume/generate-resume-button";
import { createClient } from "@/lib/supabase/server";
import { createApplication } from "../actions";

export default async function NewApplicationPage() {
  const supabase = await createClient();
  const [{ data: jobs }, { data: applications }] = await Promise.all([
    supabase.from("jobs").select("*").order("created_at", { ascending: false }),
    supabase.from("applications").select("job_id"),
  ]);

  const trackedJobIds = new Set((applications ?? []).map((a) => a.job_id));
  const untracked = (jobs ?? []).filter((j) => !trackedJobIds.has(j.id));

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Track a job</h1>
        <p className="text-muted-foreground">
          Pick a job you&apos;ve already analyzed to start tracking it.
        </p>
      </div>

      {untracked.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Every analyzed job is already tracked.{" "}
          <Link href="/jobs/new" className="underline">
            Analyze a new job
          </Link>{" "}
          first.
        </p>
      )}

      <div className="grid gap-3">
        {untracked.map((job) => (
          <Card key={job.id}>
            <CardHeader>
              <CardTitle>{job.title ?? "Untitled role"}</CardTitle>
              <CardDescription>{job.company ?? "Unknown company"}</CardDescription>
            </CardHeader>
            <CardContent>
              <GenerateResumeButton
                action={createApplication.bind(null, job.id)}
                label="Track this application"
                pendingLabel="Adding..."
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
