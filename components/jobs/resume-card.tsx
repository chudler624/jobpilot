"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SKIP_THRESHOLD } from "@/lib/match/recommend";
import type { ActionState } from "@/lib/career-profile/schemas";
import type { Database } from "@/types/supabase";

type ResumeVersion = Database["public"]["Tables"]["resume_versions"]["Row"];
type JobScore = Database["public"]["Tables"]["job_scores"]["Row"];

export function ResumeCard({
  versions,
  score,
  action,
}: {
  versions: ResumeVersion[];
  score: JobScore | null;
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, isPending] = useActionState(action, {});
  const weakMatch = score !== null && score.required_skills_score < SKIP_THRESHOLD;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resume</CardTitle>
        <CardDescription>
          Generate a resume tailored to this job.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {versions.length > 0 && (
          <ul className="space-y-1 text-sm">
            {versions.map((v) => (
              <li key={v.id}>
                <Link href={`/resume/${v.id}`} className="hover:underline">
                  {v.label} (v{v.version_number})
                </Link>
              </li>
            ))}
          </ul>
        )}
        {weakMatch && (
          <p className="text-sm text-destructive">
            Required-skills match is only{" "}
            {Math.round(score!.required_skills_score * 100)}% — a tailored
            resume probably won&apos;t be strong for this job. You can still
            generate one.
          </p>
        )}
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <form action={formAction}>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? "Generating..."
              : versions.length > 0
                ? "Generate new version"
                : "Generate tailored resume"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
