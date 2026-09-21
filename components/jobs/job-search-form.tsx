"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DiscoveryResultsPreview } from "@/components/jobs/discovery-results-preview";
import { searchJobs } from "@/app/(dashboard)/jobs/discover/actions";

// One title search across every keyword-searchable source (Adzuna and
// Jobicy). Searching never saves anything by itself — results are a
// preview, saved one at a time below, each tagged with its source.
export function JobSearchForm() {
  const [state, formAction, isPending] = useActionState(searchJobs, {});

  return (
    <div className="space-y-4">
      <form action={formAction} className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="search-what">Job title / keyword</Label>
            <Input id="search-what" name="what" placeholder="automation engineer" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="search-where">Location</Label>
            <Input id="search-where" name="where" placeholder="austin, new york..." />
            <p className="text-xs text-muted-foreground">
              A real place name — Adzuna geocodes this, so &quot;remote&quot;
              won&apos;t match anything. Jobicy lists remote roles only and
              keeps worldwide ones. Leave blank to search everywhere.
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="search-exclude">Exclude</Label>
            <Input id="search-exclude" name="whatExclude" placeholder="senior, manager..." />
          </div>
          <div className="space-y-1">
            <Label htmlFor="search-salary-min">Minimum salary</Label>
            <Input id="search-salary-min" name="salaryMin" type="number" />
            <p className="text-xs text-muted-foreground">
              Applies to Adzuna only; Jobicy results aren&apos;t filtered by salary.
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="search-max-days-old">Posted within (days)</Label>
            <Input id="search-max-days-old" name="maxDaysOld" type="number" placeholder="30" />
          </div>
        </div>
        <div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Searching..." : "Search jobs"}
          </Button>
        </div>
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        {state?.warnings?.map((warning) => (
          <p key={warning} className="text-sm text-muted-foreground">
            {warning}
          </p>
        ))}
      </form>
      {state?.results && <DiscoveryResultsPreview source="adzuna" results={state.results} />}
    </div>
  );
}
