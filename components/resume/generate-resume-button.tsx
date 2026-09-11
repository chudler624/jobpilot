"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/career-profile/schemas";

export function GenerateResumeButton({
  action,
  label,
  pendingLabel,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  label: string;
  pendingLabel?: string;
}) {
  const [state, formAction, isPending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <Button type="submit" disabled={isPending}>
        {isPending ? (pendingLabel ?? "Generating...") : label}
      </Button>
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
    </form>
  );
}
