"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseFormData, type ActionState } from "@/lib/career-profile/schemas";
import {
  contactSchema,
  interviewSchema,
  followUpSchema,
} from "@/lib/applications/schemas";

export async function createContact(
  applicationId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseFormData(contactSchema, formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase.from("contacts").insert({
    ...parsed.data,
    user_id: user.id,
    application_id: applicationId,
  });

  if (error) return { error: error.message };

  revalidatePath(`/applications/${applicationId}`);
  return {};
}

export async function deleteContact(applicationId: string, contactId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("contacts").delete().eq("id", contactId).eq("user_id", user.id);
  revalidatePath(`/applications/${applicationId}`);
}

export async function createInterview(
  applicationId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseFormData(interviewSchema, formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase.from("interviews").insert({
    ...parsed.data,
    user_id: user.id,
    application_id: applicationId,
  });

  if (error) return { error: error.message };

  revalidatePath(`/applications/${applicationId}`);
  return {};
}

export async function deleteInterview(applicationId: string, interviewId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("interviews").delete().eq("id", interviewId).eq("user_id", user.id);
  revalidatePath(`/applications/${applicationId}`);
}

export async function createFollowUp(
  applicationId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseFormData(followUpSchema, formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase.from("follow_ups").insert({
    ...parsed.data,
    user_id: user.id,
    application_id: applicationId,
  });

  if (error) return { error: error.message };

  revalidatePath(`/applications/${applicationId}`);
  return {};
}

export async function toggleFollowUpComplete(
  applicationId: string,
  followUpId: string,
  completed: boolean
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("follow_ups")
    .update({ completed, completed_at: completed ? new Date().toISOString() : null })
    .eq("id", followUpId)
    .eq("user_id", user.id);

  revalidatePath(`/applications/${applicationId}`);
}

export async function deleteFollowUp(applicationId: string, followUpId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("follow_ups").delete().eq("id", followUpId).eq("user_id", user.id);
  revalidatePath(`/applications/${applicationId}`);
}
