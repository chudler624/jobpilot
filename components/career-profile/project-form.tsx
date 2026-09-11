"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import type { ActionState } from "@/lib/career-profile/schemas";
import type { Database } from "@/types/supabase";

type Project = Database["public"]["Tables"]["projects"]["Row"];

export function ProjectForm({
  project,
  action,
  deleteAction,
}: {
  project?: Project;
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  deleteAction?: () => Promise<void>;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <div className="space-y-6">
      <form action={formAction} className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required defaultValue={project?.name} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            name="url"
            type="text"
            placeholder="https://... (optional)"
            defaultValue={project?.url ?? ""}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="start_date">Start date</Label>
            <Input
              id="start_date"
              name="start_date"
              type="date"
              defaultValue={project?.start_date ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="end_date">End date</Label>
            <Input
              id="end_date"
              name="end_date"
              type="date"
              defaultValue={project?.end_date ?? ""}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="technologies">Technologies</Label>
          <Input
            id="technologies"
            name="technologies"
            placeholder="React, TypeScript, Postgres"
            defaultValue={project?.technologies?.join(", ") ?? ""}
          />
          <p className="text-xs text-muted-foreground">Comma-separated.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={project?.description ?? ""}
          />
        </div>
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <Button type="submit" className="self-start">
          {project ? "Save changes" : "Add project"}
        </Button>
      </form>
      {deleteAction && (
        <form action={deleteAction}>
          <ConfirmSubmitButton confirmMessage="Delete this project? Its accomplishments will be deleted too.">
            Delete project
          </ConfirmSubmitButton>
        </form>
      )}
    </div>
  );
}
