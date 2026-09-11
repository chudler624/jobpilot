"use client";

import { useState, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { setSectionVerified } from "@/app/(dashboard)/resume/actions";

export function VerifyCheckbox({
  sectionId,
  versionId,
  initialVerified,
}: {
  sectionId: string;
  versionId: string;
  initialVerified: boolean;
}) {
  const [checked, setChecked] = useState(initialVerified);
  const [isPending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox
        checked={checked}
        disabled={isPending}
        onCheckedChange={(value) => {
          const next = value === true;
          setChecked(next);
          startTransition(async () => {
            const result = await setSectionVerified(sectionId, versionId, next);
            if (result.error) setChecked(!next);
          });
        }}
      />
      I&apos;ve verified this claim is accurate
    </label>
  );
}
