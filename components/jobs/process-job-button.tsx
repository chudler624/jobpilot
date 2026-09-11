"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { extractJobRequirements } from "@/app/(dashboard)/jobs/discover/actions";
import { analyzeMatch } from "@/app/(dashboard)/jobs/actions";

// Batching without a queue: each click chains two existing single-job
// server actions (extractJobRequirements, then the existing analyzeMatch —
// reused as-is, no second scoring mechanism). "Process all" on the
// discover page just calls this per row; there's no background worker,
// so nothing risks a single-request timeout even for a large batch.
export function ProcessJobButton({ jobId }: { jobId: string }) {
  const [status, setStatus] = useState<"idle" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = () => {
    startTransition(async () => {
      setError(null);
      const extracted = await extractJobRequirements(jobId, {}, new FormData());
      if (extracted.error) {
        setError(extracted.error);
        return;
      }
      const scored = await analyzeMatch(jobId, {}, new FormData());
      if (scored.error) {
        setError(scored.error);
        return;
      }
      setStatus("done");
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending || status === "done"}
        onClick={run}
      >
        {isPending ? "Processing..." : status === "done" ? "Scored" : "Extract & score"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
