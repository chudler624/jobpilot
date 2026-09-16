"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { importJobsCsv } from "@/app/(dashboard)/jobs/discover/actions";

// No fetching happens here — this only reads a CSV you already have and
// creates a snippet-only job per row (title/company/location/url). See
// ADR-020's paste box / extension capture for how a description gets
// attached afterward.
export function CsvImportForm() {
  const [state, formAction, isPending] = useActionState(importJobsCsv, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.added !== undefined) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <Input name="csvFile" type="file" accept=".csv,text/csv" required />
      <Button type="submit" variant="outline" size="sm" disabled={isPending}>
        {isPending ? "Importing..." : "Import CSV"}
      </Button>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
      {(state?.added !== undefined || state?.duplicates !== undefined) && (
        <p className="text-xs text-muted-foreground">
          Added {state.added ?? 0}
          {!!state.duplicates && `, skipped ${state.duplicates} already imported`}
          {!!state.skipped && `, ${state.skipped} row(s) missing a title or url`}.
        </p>
      )}
    </form>
  );
}
