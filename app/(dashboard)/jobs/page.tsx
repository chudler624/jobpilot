import Link from "next/link";
import { Card } from "@/components/ui/card";
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

function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default async function JobsPage() {
  const supabase = await createClient();
  const [{ data: jobs }, { data: scores }] = await Promise.all([
    supabase.from("jobs").select("*").order("created_at", { ascending: false }),
    supabase.from("job_scores").select("job_id, overall_score"),
  ]);

  const scoreByJob = new Map((scores ?? []).map((s) => [s.job_id, s.overall_score]));

  return (
    <div>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-[26px] leading-tight font-medium">Jobs</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            Paste a job description to extract structured fields.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <Link href="/jobs/discover" className={buttonVariants({ variant: "outline" })}>
            Discover jobs
          </Link>
          <Link href="/jobs/new" className={buttonVariants()}>
            Analyze a job
          </Link>
        </div>
      </div>

      {!jobs?.length && (
        <p className="mt-7 text-sm text-muted-foreground">
          No jobs yet. Analyze your first one to get started.
        </p>
      )}

      <div className="mt-7 flex flex-col gap-3">
        {jobs?.map((job) => {
          const salary = formatSalary(
            job.salary_min,
            job.salary_max,
            job.salary_currency
          );
          const score = scoreByJob.get(job.id);
          return (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="flex-row items-center justify-between gap-4 px-[18px] transition-colors hover:bg-secondary">
                <div className="min-w-0">
                  <div className="text-base font-medium">
                    {job.title ?? "Untitled role"}
                    {job.company && (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        · {job.company}
                      </span>
                    )}
                  </div>
                  <div className="mt-[3px] text-[13.5px] text-muted-foreground">
                    {job.location && <span>{job.location}</span>}
                    {job.location && salary && <span> · </span>}
                    {salary && <span className="font-mono tabular">{salary}</span>}
                    {!job.location && !salary && (
                      <span>No location or salary extracted</span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  {job.workplace_type && (
                    <Badge variant="outline">
                      {sentenceCase(job.workplace_type)}
                    </Badge>
                  )}
                  {score !== undefined && (
                    <span className="min-w-10 text-right font-mono text-[28px] font-medium tabular">
                      {Math.round(score * 100)}
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
