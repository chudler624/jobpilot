"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/lib/career-profile/schemas";

export function AddContactForm({
  action,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, isPending] = useActionState(action, {});

  return (
    <form action={formAction} className="grid gap-2 sm:grid-cols-2">
      <div className="space-y-1">
        <Label htmlFor="contact-name">Name</Label>
        <Input id="contact-name" name="name" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="contact-role">Role</Label>
        <Input id="contact-role" name="role" placeholder="Recruiter" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="contact-email">Email</Label>
        <Input id="contact-email" name="email" type="email" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="contact-phone">Phone</Label>
        <Input id="contact-phone" name="phone" />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="contact-linkedin">LinkedIn URL</Label>
        <Input id="contact-linkedin" name="linkedin_url" />
      </div>
      {state?.error && (
        <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>
      )}
      <Button type="submit" size="sm" className="self-start sm:col-span-2" disabled={isPending}>
        {isPending ? "Adding..." : "Add contact"}
      </Button>
    </form>
  );
}
