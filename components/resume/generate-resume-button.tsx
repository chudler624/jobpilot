"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/career-profile/schemas";

export function GenerateResumeButton({
  action,
  label,
  pendingLabel,
  variant = "default",
  disabled = false,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  label: string;
  pendingLabel?: string;
  variant?: "default" | "outline";
  disabled?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <Button type="submit" variant={variant} disabled={isPending || disabled}>
        {isPending ? (pendingLabel ?? "Generating...") : label}
      </Button>
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
    </form>
  );
}
