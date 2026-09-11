"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addWatchedCompany } from "@/app/(dashboard)/jobs/discover/actions";

export function AddWatchedCompanyForm() {
  const [state, formAction, isPending] = useActionState(addWatchedCompany, {});

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <Label htmlFor="watch-name">Company name</Label>
        <Input id="watch-name" name="name" required placeholder="GitLab" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="watch-token">Greenhouse board token</Label>
        <Input id="watch-token" name="board_token" required placeholder="gitlab" />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Checking..." : "Watch company"}
      </Button>
      {state?.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
