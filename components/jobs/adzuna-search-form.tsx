"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { searchAdzuna } from "@/app/(dashboard)/jobs/discover/actions";

// Adzuna natively supports role/location/exclusion/salary/recency as real
// search parameters — a richer pre-fetch filter set than Greenhouse's
// board-listing API can offer (see ADR-016).
export function AdzunaSearchForm() {
  const [state, formAction, isPending] = useActionState(searchAdzuna, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="adzuna-what">Role / keyword</Label>
          <Input id="adzuna-what" name="what" placeholder="automation engineer" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="adzuna-where">Location</Label>
          <Input id="adzuna-where" name="where" placeholder="remote, austin..." />
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
      {state?.summary && <p className="text-sm text-muted-foreground">{state.summary}</p>}
    </form>
  );
}
