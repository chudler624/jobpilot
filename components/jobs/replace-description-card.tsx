"use client";

import { useActionState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/lib/career-profile/schemas";

export function ReplaceDescriptionCard({
  action,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, isPending] = useActionState(action, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add the full posting</CardTitle>
        <CardDescription>
          Only a short snippet of this job came through the search. Open the
          original listing, copy the full description, and paste it here —
          requirements, skills and experience level are re-extracted from it.
          Any existing match score is cleared so it can be re-analyzed against
          the full posting.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <Textarea
            name="rawText"
            rows={8}
            placeholder="Paste the full job description..."
            required
          />
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Extracting..." : "Re-extract from full posting"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
