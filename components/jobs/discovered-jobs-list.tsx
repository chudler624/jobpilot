"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ProcessJobButton } from "@/components/jobs/process-job-button";
import { parseMinYears } from "@/lib/match/score";
import type { JobSource } from "@/types/supabase";

export interface DiscoveredJob {
  id: string;
  title: string | null;
  company: string | null;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  experienceRequirement: string | null;
  hasRequirements: boolean;
  overallScore: number | null;
  source: JobSource | null;
  sourceUrl: string | null;
  isSnippetOnly: boolean;
}

const SOURCE_LABELS: Record<JobSource, string> = {
  greenhouse: "Greenhouse",
  adzuna: "Adzuna",
  remotive: "Remotive",
};

// Post-extraction filters — salary and experience aren't known until a
// job has been through extractJobRequirements, so these only narrow
// already-processed jobs; jobs with no salary/experience data are always
// shown rather than hidden by an unknowable filter. Source-agnostic: the
// same filter applies regardless of which discovery source a job came from.
export function DiscoveredJobsList({ jobs }: { jobs: DiscoveredJob[] }) {
  const [minSalary, setMinSalary] = useState("");
  const [maxYears, setMaxYears] = useState("");

  const filtered = useMemo(() => {
    const minSalaryNum = minSalary ? Number(minSalary) : null;
    const maxYearsNum = maxYears ? Number(maxYears) : null;

    return jobs.filter((job) => {
      if (minSalaryNum !== null) {
        const salary = job.salaryMax ?? job.salaryMin;
        if (salary !== null && salary < minSalaryNum) return false;
      }
      if (maxYearsNum !== null) {
        const required = parseMinYears(job.experienceRequirement);
        if (required !== null && required > maxYearsNum) return false;
      }
      return true;
    });
  }, [jobs, minSalary, maxYears]);

  if (jobs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No discovered jobs yet — search for a job title or fetch from a watched company above.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor="min-salary">Min salary</Label>
          <Input
            id="min-salary"
            type="number"
            value={minSalary}
            onChange={(e) => setMinSalary(e.target.value)}
            className="w-full sm:w-32"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="max-years">Max years required</Label>
          <Input
            id="max-years"
            type="number"
            value={maxYears}
            onChange={(e) => setMaxYears(e.target.value)}
            className="w-full sm:w-32"
          />
        </div>
      </div>

      <ul className="space-y-2">
        {filtered.map((job) => (
          <li
            key={job.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 text-sm"
          >
            <div>
              <Link href={`/jobs/${job.id}`} className="font-medium hover:underline">
                {job.title ?? "Untitled role"}
              </Link>
              <p className="text-muted-foreground">
                {[job.company, job.location].filter(Boolean).join(" · ")}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {job.source && (
                  <Badge variant="outline">{SOURCE_LABELS[job.source]}</Badge>
                )}
                {job.isSnippetOnly && (
                  <Badge variant="secondary" marker="unverified">
                    Snippet only
                  </Badge>
                )}
                {(job.source === "adzuna" || job.source === "remotive") && job.sourceUrl && (
                  <a
                    href={job.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    via {SOURCE_LABELS[job.source]}
                  </a>
                )}
              </div>
            </div>
            {job.overallScore !== null ? (
              <Badge variant="secondary">{Math.round(job.overallScore * 100)}% match</Badge>
            ) : job.hasRequirements ? (
              <Badge variant="outline">Extracted, not scored</Badge>
            ) : (
              <ProcessJobButton jobId={job.id} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
