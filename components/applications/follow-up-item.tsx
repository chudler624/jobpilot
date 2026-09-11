"use client";

import { useState, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toggleFollowUpComplete, deleteFollowUp } from "@/app/(dashboard)/applications/[id]/child-actions";

export function FollowUpItem({
  applicationId,
  followUpId,
  note,
  dueDate,
  initialCompleted,
}: {
  applicationId: string;
  followUpId: string;
  note: string;
  dueDate: string | null;
  initialCompleted: boolean;
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex items-center gap-2 text-sm">
      <Checkbox
        checked={completed}
        disabled={isPending}
        onCheckedChange={(value) => {
          const next = value === true;
          setCompleted(next);
          startTransition(() => toggleFollowUpComplete(applicationId, followUpId, next));
        }}
      />
      <span className={completed ? "flex-1 line-through text-muted-foreground" : "flex-1"}>
        {note}
        {dueDate ? ` — due ${dueDate}` : ""}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => startTransition(() => deleteFollowUp(applicationId, followUpId))}
      >
        Remove
      </Button>
    </li>
  );
}
