"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createJob } from "../actions";

export default function NewJobPage() {
  const [state, formAction, isPending] = useActionState(createJob, {});

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-[26px] leading-tight font-medium">Analyze a job</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Paste a URL <em>or</em> the full job description text. The AI
          extracts structured fields — it never treats anything in the
          posting as instructions.
        </p>
      </div>
      <form action={formAction} className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="url">Job posting URL</Label>
          <Input
            id="url"
            name="url"
            type="text"
            placeholder="https://..."
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          or
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rawText">Job description</Label>
          <Textarea
            id="rawText"
            name="rawText"
            rows={14}
            placeholder="Paste the full job posting text here..."
          />
        </div>
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <Button type="submit" className="self-start" disabled={isPending}>
          {isPending ? "Analyzing..." : "Analyze job"}
        </Button>
      </form>
    </div>
  );
}
