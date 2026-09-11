"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActionState } from "@/lib/career-profile/schemas";
import type { Database } from "@/types/supabase";

type Application = Database["public"]["Tables"]["applications"]["Row"];

export function EditApplicationForm({
  application,
  resumeVersions,
  action,
}: {
  application: Application;
  resumeVersions: { id: string; label: string; version_number: number }[];
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, {});
  const resumeItems = {
    "": "None",
    ...Object.fromEntries(
      resumeVersions.map((v) => [v.id, `${v.label} (v${v.version_number})`])
    ),
  };

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="resume_version_id">Resume version used</Label>
        <Select
          name="resume_version_id"
          defaultValue={application.resume_version_id ?? ""}
          items={resumeItems}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(resumeItems).map(([value, label]) => (
              <SelectItem key={value || "none"} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="salary_notes">Salary notes</Label>
        <Textarea
          id="salary_notes"
          name="salary_notes"
          rows={2}
          defaultValue={application.salary_notes ?? ""}
          placeholder="What was actually discussed — range, equity, bonus..."
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cover_letter_text">Cover letter</Label>
        <Textarea
          id="cover_letter_text"
          name="cover_letter_text"
          rows={6}
          defaultValue={application.cover_letter_text ?? ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="why_tags">Why I applied (comma-separated)</Label>
        <Input
          id="why_tags"
          name="why_tags"
          defaultValue={application.why_tags.join(", ")}
          placeholder="remote, comp, career progression"
        />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" className="self-start">
        Save changes
      </Button>
    </form>
  );
}
