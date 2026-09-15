"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DiscoveryResultsPreview } from "@/components/jobs/discovery-results-preview";
import { searchAdzuna } from "@/app/(dashboard)/jobs/discover/actions";

// Adzuna natively supports role/location/exclusion/salary/recency as real
// search parameters — a richer pre-fetch filter set than Greenhouse's
// board-listing API can offer (see ADR-016). Searching never saves
// anything by itself — results are a preview, saved one at a time below.
export function AdzunaSearchForm() {
  const [state, formAction, isPending] = useActionState(searchAdzuna, {});

  return (
    <div className="space-y-4">
      <form action={formAction} className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="adzuna-what">Role / keyword</Label>
            <Input id="adzuna-what" name="what" placeholder="automation engineer" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="adzuna-where">Location</Label>
            <Input id="adzuna-where" name="where" placeholder="austin, new york..." />
            <p className="text-xs text-muted-foreground">
              A real place name — Adzuna geocodes this, so &quot;remote&quot;
              won&apos;t match anything. Leave blank to search everywhere.
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="adzuna-exclude">Exclude</Label>
            <Input id="adzuna-exclude" name="whatExclude" placeholder="senior, manager..." />
          </div>
          <div className="space-y-1">
            <Label htmlFor="adzuna-salary-min">Minimum salary</Label>
            <Input id="adzuna-salary-min" name="salaryMin" type="number" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="adzuna-max-days-old">Posted within (days)</Label>
            <Input id="adzuna-max-days-old" name="maxDaysOld" type="number" placeholder="30" />
          </div>
        </div>
        <div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Searching..." : "Search Adzuna"}
          </Button>
        </div>
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      </form>
      {state?.results && <DiscoveryResultsPreview source="adzuna" results={state.results} />}
    </div>
  );
}
