"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { EvidencePicker } from "@/components/career-profile/evidence-picker";
import { createAccomplishment } from "@/app/(dashboard)/career-profile/accomplishments/actions";
import type { ActionState } from "@/lib/career-profile/schemas";

type Parent = { experienceId: string } | { projectId: string };

export function AccomplishmentAddForm({
  evidenceOptions,
  parent,
}: {
  evidenceOptions: { id: string; title: string }[];
  parent: Parent;
}) {
  const createWithParent = createAccomplishment.bind(null, parent);
  const [state, formAction] = useActionState<ActionState, FormData>(
    createWithParent,
    {}
  );

  return (
    <Card>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <Label htmlFor="new-accomplishment-description">
            Add an accomplishment
          </Label>
          <Textarea
            id="new-accomplishment-description"
            name="description"
            required
            rows={2}
            placeholder="What did you accomplish here?"
          />
          <EvidencePicker evidenceOptions={evidenceOptions} />
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" size="sm">
            Add accomplishment
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
