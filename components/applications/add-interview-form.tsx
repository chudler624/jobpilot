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

export function AddInterviewForm({
  contacts,
  action,
}: {
  contacts: { id: string; name: string }[];
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, isPending] = useActionState(action, {});
  const contactItems = {
    "": "None",
    ...Object.fromEntries(contacts.map((c) => [c.id, c.name])),
  };

  return (
    <form action={formAction} className="grid gap-2 sm:grid-cols-2">
      <div className="space-y-1">
        <Label htmlFor="interview-type">Type</Label>
        <Input
          id="interview-type"
          name="interview_type"
          placeholder="Phone screen, technical, onsite..."
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="interview-scheduled">Scheduled</Label>
        <Input id="interview-scheduled" name="scheduled_at" type="datetime-local" />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="interview-contact">Interviewer</Label>
        <Select name="contact_id" defaultValue="" items={contactItems}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(contactItems).map(([value, label]) => (
              <SelectItem key={value || "none"} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="interview-notes">Notes</Label>
        <Textarea id="interview-notes" name="notes" rows={2} />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="interview-outcome">Outcome</Label>
        <Input id="interview-outcome" name="outcome" />
      </div>
      {state?.error && (
        <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>
      )}
      <Button type="submit" size="sm" className="self-start sm:col-span-2" disabled={isPending}>
        {isPending ? "Adding..." : "Add interview"}
      </Button>
    </form>
  );
}
