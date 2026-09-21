"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { saveDiscoveredJob } from "@/app/(dashboard)/jobs/discover/actions";
import type { DiscoveredJobRaw, SourcedJob } from "@/lib/discovery/types";
import type { JobSource } from "@/types/supabase";

const ATTRIBUTION: Partial<Record<JobSource, string>> = {
  adzuna: "via Adzuna",
  jobicy: "via Jobicy",
};

function ResultRow({ source, job }: { source: JobSource; job: DiscoveredJobRaw }) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 text-sm">
      <div className="min-w-0">
        <p className="font-medium">{job.title}</p>
        <p className="text-muted-foreground">
          {[job.company, job.location].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {job.snippetOnly && (
            <Badge variant="secondary" marker="unverified">
              Snippet only
            </Badge>
          )}
          {job.sourceUrl && (
            <a
              href={job.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              {ATTRIBUTION[source] ?? "View listing"}
            </a>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {error && <span className="text-xs text-destructive">{error}</span>}
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending || saved}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await saveDiscoveredJob(source, job);
              if (result.error) setError(result.error);
              else setSaved(true);
            });
          }}
        >
          {isPending ? "Saving..." : saved ? "Saved" : "Save job"}
        </Button>
      </div>
    </li>
  );
}

// Nothing here has been written to the jobs table yet — this is a
// review-before-save list (same instinct as Phase 1.5's resume-import
// review screen), not a completed action. Each row is saved individually.
export function DiscoveryResultsPreview({
  source,
  results,
}: {
  source: JobSource;
  results: (DiscoveredJobRaw | SourcedJob)[];
}) {
  if (results.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No open jobs matched those filters.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Found {results.length} job{results.length === 1 ? "" : "s"} — review
        and save the ones you want to track.
      </p>
      <ul className="space-y-2">
        {results.map((job) => {
          const jobSource = "source" in job ? job.source : source;
          return (
            <ResultRow
              key={`${jobSource}-${job.externalId ?? job.sourceUrl ?? job.title}`}
              source={jobSource}
              job={job}
            />
          );
        })}
      </ul>
    </div>
  );
}
