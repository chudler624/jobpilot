import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddWatchedCompanyForm } from "@/components/jobs/add-watched-company-form";
import { FetchJobsForm } from "@/components/jobs/fetch-jobs-form";
import { JobSearchForm } from "@/components/jobs/job-search-form";
import { CsvImportForm } from "@/components/jobs/csv-import-form";
import { DiscoveredJobsList, type DiscoveredJob } from "@/components/jobs/discovered-jobs-list";
import { createClient } from "@/lib/supabase/server";
import { deleteWatchedCompany } from "./actions";

// A single Adzuna search can run up to ADZUNA_RESULTS_PER_PAGE full-text
// fetches concurrently before insert — give the server action more room
// than the platform default so a slow batch doesn't get cut off mid-run.
export const maxDuration = 60;

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
      .not("source", "is", null)
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
    source: job.source,
    sourceUrl: job.source_url,
    isSnippetOnly: job.is_snippet_only,
  }));

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-[26px] leading-tight font-medium">Discover jobs</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Search by job title, or pull open jobs from companies you watch on
          Greenhouse, instead of pasting one at a time.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search jobs</CardTitle>
          <CardDescription>
            Enter a job title and search Adzuna (broad aggregator, usually a
            snippet) and Remotive (remote roles, full posting text) at once.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JobSearchForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import a CSV</CardTitle>
          <CardDescription>
            For a jobs list you already have (title, company, location, url
            columns) — from your own LinkedIn search export, a spreadsheet,
            etc. This only reads the file; it doesn&apos;t fetch or scrape
            those URLs. Each row becomes a job you can open and capture
            (with the browser extension) or paste a description into.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CsvImportForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Watched companies (Greenhouse)</CardTitle>
          <CardDescription>
            Optional — for when you want every open job at a specific company.
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
