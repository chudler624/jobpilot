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
import type { ActionState } from "@/lib/career-profile/schemas";
import type { Database } from "@/types/supabase";

type ResumeVersion = Database["public"]["Tables"]["resume_versions"]["Row"];

export function ResumeCard({
  versions,
  action,
}: {
  versions: ResumeVersion[];
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, isPending] = useActionState(action, {});

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
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <form action={formAction}>
          <Button type="submit" variant="outline" disabled={isPending}>
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
