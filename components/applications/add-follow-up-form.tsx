"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/lib/career-profile/schemas";

export function AddFollowUpForm({
  action,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, isPending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="flex-1 space-y-1">
        <Label htmlFor="followup-note">Note</Label>
        <Input id="followup-note" name="note" required placeholder="Send thank-you email" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="followup-due">Due</Label>
        <Input id="followup-due" name="due_date" type="date" />
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Adding..." : "Add follow-up"}
      </Button>
      {state?.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
