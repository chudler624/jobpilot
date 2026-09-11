"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { evidenceSchema, parseFormData } from "@/lib/career-profile/schemas";

export async function createEvidence(formData: FormData) {
  const result = parseFormData(evidenceSchema, formData);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Invalid evidence");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("evidence")
    .insert({ ...result.data, user_id: user.id });

  if (error) throw new Error(error.message);

  revalidatePath("/career-profile/evidence");
  redirect("/career-profile/evidence");
}

export async function updateEvidence(id: string, formData: FormData) {
  const result = parseFormData(evidenceSchema, formData);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Invalid evidence");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("evidence")
    .update({ ...result.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

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
