"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchDiscoveredJobs } from "@/app/(dashboard)/jobs/discover/actions";

export function FetchJobsForm({ companyId }: { companyId: string }) {
  const [state, formAction, isPending] = useActionState(
    fetchDiscoveredJobs.bind(null, companyId),
    {}
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <Input name="role" placeholder="Role contains..." className="w-40" />
      <Input name="location" placeholder="Location contains..." className="w-40" />
      <Input name="exclude" placeholder="Exclude (comma-separated)" className="w-48" />
      <Button type="submit" variant="outline" size="sm" disabled={isPending}>
        {isPending ? "Fetching..." : "Fetch new jobs"}
      </Button>
      {state?.error && <p className="w-full text-xs text-destructive">{state.error}</p>}
      {state?.summary && <p className="w-full text-xs text-muted-foreground">{state.summary}</p>}
    </form>
  );
}
