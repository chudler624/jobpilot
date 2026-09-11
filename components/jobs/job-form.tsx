"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import type { ActionState } from "@/lib/career-profile/schemas";
import type { Database } from "@/types/supabase";

type Job = Database["public"]["Tables"]["jobs"]["Row"];

const WORKPLACE_LABELS = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "Onsite",
} as const;

export function JobForm({
  job,
  action,
  deleteAction,
}: {
  job: Job;
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  deleteAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, {});
  const [deleteState, deleteFormAction] = useActionState(deleteAction, {});

  return (
    <div className="space-y-6">
      <form action={formAction} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="company">Company</Label>
            <Input id="company" name="company" defaultValue={job.company ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={job.title ?? ""} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              defaultValue={job.location ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="workplace_type">Workplace type</Label>
            <Select
              name="workplace_type"
              defaultValue={job.workplace_type ?? ""}
              items={{ "": "Unknown", ...WORKPLACE_LABELS }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Unknown" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unknown</SelectItem>
                {Object.entries(WORKPLACE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="salary_min">Salary min</Label>
            <Input
              id="salary_min"
              name="salary_min"
              type="number"
              defaultValue={job.salary_min ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="salary_max">Salary max</Label>
            <Input
              id="salary_max"
              name="salary_max"
              type="number"
              defaultValue={job.salary_max ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="salary_currency">Currency</Label>
            <Input
              id="salary_currency"
              name="salary_currency"
              placeholder="USD"
              defaultValue={job.salary_currency ?? ""}
            />
          </div>
        </div>
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <Button type="submit" className="self-start">
          Save changes
        </Button>
      </form>
      <form action={deleteFormAction} className="space-y-2">
        <ConfirmSubmitButton confirmMessage="Delete this job? This can't be undone.">
          Delete job
        </ConfirmSubmitButton>
        {deleteState?.error && (
          <p className="text-sm text-destructive">{deleteState.error}</p>
        )}
      </form>
    </div>
  );
}
