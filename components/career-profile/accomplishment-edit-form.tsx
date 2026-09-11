"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { EvidencePicker } from "@/components/career-profile/evidence-picker";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import {
  updateAccomplishment,
  deleteAccomplishment,
} from "@/app/(dashboard)/career-profile/accomplishments/actions";
import type { ActionState } from "@/lib/career-profile/schemas";
import type { Database } from "@/types/supabase";

type Accomplishment = Database["public"]["Tables"]["accomplishments"]["Row"];
type Parent = { experienceId: string } | { projectId: string };

export function AccomplishmentEditForm({
  accomplishment,
  evidenceOptions,
  parent,
}: {
  accomplishment: Accomplishment;
  evidenceOptions: { id: string; title: string }[];
  parent: Parent;
}) {
  const updateWithContext = updateAccomplishment.bind(
    null,
    accomplishment.id,
    parent
  );
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateWithContext,
    {}
  );

  return (
    <Card>
      <CardContent className="space-y-3">
        <form action={formAction} className="space-y-3">
          <Textarea
            name="description"
            required
            rows={2}
            defaultValue={accomplishment.description}
          />
          <EvidencePicker
            evidenceOptions={evidenceOptions}
            defaultValue={accomplishment.evidence_id}
          />
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" size="sm">
            Save
          </Button>
        </form>
        <form
          action={deleteAccomplishment.bind(null, accomplishment.id, parent)}
        >
          <ConfirmSubmitButton confirmMessage="Delete this accomplishment?">
            Delete
          </ConfirmSubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
