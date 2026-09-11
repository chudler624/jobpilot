"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import type { ActionState } from "@/lib/career-profile/schemas";
import type { Database } from "@/types/supabase";

type Experience = Database["public"]["Tables"]["experiences"]["Row"];

export function ExperienceForm({
  experience,
  action,
  deleteAction,
}: {
  experience?: Experience;
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  deleteAction?: () => Promise<void>;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <div className="space-y-6">
      <form action={formAction} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              name="company"
              required
              defaultValue={experience?.company}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={experience?.title}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            defaultValue={experience?.location ?? ""}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="start_date">Start date</Label>
            <Input
              id="start_date"
              name="start_date"
              type="date"
              required
              defaultValue={experience?.start_date ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="end_date">End date</Label>
            <Input
              id="end_date"
              name="end_date"
              type="date"
              defaultValue={experience?.end_date ?? ""}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank if this is your current role.
            </p>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="technologies">Technologies</Label>
          <Input
            id="technologies"
            name="technologies"
            placeholder="React, TypeScript, Postgres"
            defaultValue={experience?.technologies?.join(", ") ?? ""}
          />
          <p className="text-xs text-muted-foreground">Comma-separated.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={experience?.description ?? ""}
          />
        </div>
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <Button type="submit" className="self-start">
          {experience ? "Save changes" : "Add experience"}
        </Button>
      </form>
      {deleteAction && (
        <form action={deleteAction}>
          <ConfirmSubmitButton confirmMessage="Delete this experience? Its accomplishments will be deleted too.">
            Delete experience
          </ConfirmSubmitButton>
        </form>
      )}
    </div>
  );
}
