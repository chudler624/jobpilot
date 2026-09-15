"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { extractJobRequirements } from "@/app/(dashboard)/jobs/discover/actions";

// Shown after the browser extension has captured a full posting and sent
// this tab back with ?captured=1 — extraction needs the server-side AI
// provider, so the extension hands off here instead of calling it itself.
export function AutoExtract({ jobId }: { jobId: string }) {
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    extractJobRequirements(jobId, {}, new FormData()).then((result) => {
      if (result.error) setError(result.error);
      else router.replace(`/jobs/${jobId}`);
    });
  }, [jobId, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Full posting captured</CardTitle>
        <CardDescription>
          {error
            ? `${error} Clicking "Analyze match" will retry the extraction.`
            : "Extracting requirements, skills and experience from the full posting..."}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
