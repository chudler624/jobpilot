import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

function formatSalary(min: number | null, max: number | null, currency: string | null) {
  if (min === null && max === null) return null;
  const cur = currency ?? "";
  if (min !== null && max !== null && min !== max) {
    return `${cur} ${min.toLocaleString()} - ${max.toLocaleString()}`.trim();
  }
  return `${cur} ${(min ?? max)!.toLocaleString()}`.trim();
}

export default async function JobsPage() {
  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Jobs</h1>
          <p className="text-muted-foreground">
            Paste a job description to extract structured fields.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/jobs/discover" className={buttonVariants({ variant: "outline" })}>
            Discover jobs
          </Link>
          <Link href="/jobs/new" className={buttonVariants()}>
            Analyze a job
          </Link>
        </div>
      </div>

      {!jobs?.length && (
        <p className="text-sm text-muted-foreground">
          No jobs yet. Analyze your first one to get started.
        </p>
      )}

      <div className="grid gap-4">
        {jobs?.map((job) => {
          const salary = formatSalary(
            job.salary_min,
            job.salary_max,
            job.salary_currency
          );
          return (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>
                      {job.title ?? "Untitled role"}
                      {job.company ? ` · ${job.company}` : ""}
                    </CardTitle>
                    <CardDescription>
                      {[job.location, salary].filter(Boolean).join(" · ") ||
                        "No location or salary extracted"}
                    </CardDescription>
                  </div>
                  {job.workplace_type && (
                    <Badge variant="secondary">{job.workplace_type}</Badge>
                  )}
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
