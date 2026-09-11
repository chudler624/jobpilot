"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  evidenceSchema,
  parseFormData,
  type ActionState,
} from "@/lib/career-profile/schemas";

export async function createEvidence(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const result = parseFormData(evidenceSchema, formData);
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid evidence" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("evidence")
    .insert({ ...result.data, user_id: user.id });

  if (error) return { error: error.message };

  revalidatePath("/career-profile/evidence");
  redirect("/career-profile/evidence");
}

export async function updateEvidence(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const result = parseFormData(evidenceSchema, formData);
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid evidence" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("evidence")
    .update({ ...result.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/career-profile/evidence");
  redirect("/career-profile/evidence");
}

export async function deleteEvidence(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("evidence")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/career-profile/evidence");
  redirect("/career-profile/evidence");
}
