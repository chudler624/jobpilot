import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddWatchedCompanyForm } from "@/components/jobs/add-watched-company-form";
import { FetchJobsForm } from "@/components/jobs/fetch-jobs-form";
import { DiscoveredJobsList, type DiscoveredJob } from "@/components/jobs/discovered-jobs-list";
import { createClient } from "@/lib/supabase/server";
import { deleteWatchedCompany } from "./actions";

export default async function DiscoverPage() {
  const supabase = await createClient();
  const [{ data: companies }, { data: jobs }] = await Promise.all([
    supabase
      .from("watched_companies")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("jobs")
      .select("*")
      .eq("source", "greenhouse")
      .order("created_at", { ascending: false }),
  ]);

  const jobIds = (jobs ?? []).map((j) => j.id);
  const [{ data: requirements }, { data: scores }] = await Promise.all([
    jobIds.length
      ? supabase
          .from("job_requirements")
          .select("job_id, experience_requirement")
          .in("job_id", jobIds)
      : Promise.resolve({ data: [] }),
    jobIds.length
      ? supabase.from("job_scores").select("job_id, overall_score").in("job_id", jobIds)
      : Promise.resolve({ data: [] }),
  ]);

  const requirementsByJob = new Map(
    (requirements ?? []).map((r) => [r.job_id, r.experience_requirement])
  );
  const scoreByJob = new Map((scores ?? []).map((s) => [s.job_id, s.overall_score]));

  const discoveredJobs: DiscoveredJob[] = (jobs ?? []).map((job) => ({
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    salaryMin: job.salary_min,
    salaryMax: job.salary_max,
    experienceRequirement: requirementsByJob.get(job.id) ?? null,
    hasRequirements: requirementsByJob.has(job.id),
    overallScore: scoreByJob.get(job.id) ?? null,
  }));

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Discover jobs</h1>
        <p className="text-muted-foreground">
          Pull open jobs from companies you watch on Greenhouse, instead of pasting one at a time.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Watched companies</CardTitle>
          <CardDescription>
            Add a company by its Greenhouse board token — the slug in their
            job board URL (e.g. &quot;gitlab&quot; for
            job-boards.greenhouse.io/gitlab).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {companies && companies.length > 0 && (
            <ul className="space-y-3">
              {companies.map((company) => (
                <li key={company.id} className="space-y-2 rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{company.name}</p>
                    <form action={deleteWatchedCompany.bind(null, company.id)}>
                      <button type="submit" className="text-xs text-muted-foreground underline">
                        Stop watching
                      </button>
                    </form>
                  </div>
                  <FetchJobsForm companyId={company.id} />
                </li>
              ))}
            </ul>
          )}
          <AddWatchedCompanyForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Discovered jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <DiscoveredJobsList jobs={discoveredJobs} />
        </CardContent>
      </Card>
    </div>
  );
}
