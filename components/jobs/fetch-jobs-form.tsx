"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DiscoveryResultsPreview } from "@/components/jobs/discovery-results-preview";
import { fetchDiscoveredJobs } from "@/app/(dashboard)/jobs/discover/actions";

// Fetching never saves anything by itself — results are a preview, saved
// one at a time below.
export function FetchJobsForm({ companyId }: { companyId: string }) {
  const [state, formAction, isPending] = useActionState(
    fetchDiscoveredJobs.bind(null, companyId),
    {}
  );

  return (
    <div className="space-y-3">
      <form action={formAction} className="flex flex-wrap items-end gap-2">
        <Input name="role" placeholder="Role contains..." className="w-full sm:w-40" />
        <Input name="location" placeholder="Location contains..." className="w-full sm:w-40" />
        <Input name="exclude" placeholder="Exclude (comma-separated)" className="w-full sm:w-48" />
        <Button type="submit" variant="outline" size="sm" disabled={isPending}>
          {isPending ? "Fetching..." : "Fetch new jobs"}
        </Button>
        {state?.error && <p className="w-full text-xs text-destructive">{state.error}</p>}
      </form>
      {state?.results && <DiscoveryResultsPreview source="greenhouse" results={state.results} />}
    </div>
  );
}
