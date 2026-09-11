"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { experienceSchema, parseFormData } from "@/lib/career-profile/schemas";

export async function createExperience(formData: FormData) {
  const result = parseFormData(experienceSchema, formData);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Invalid experience");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("experiences")
    .insert({ ...result.data, user_id: user.id });

  if (error) throw new Error(error.message);

  revalidatePath("/career-profile/experiences");
  redirect("/career-profile/experiences");
}

export async function updateExperience(id: string, formData: FormData) {
  const result = parseFormData(experienceSchema, formData);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Invalid experience");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("experiences")
    .update({ ...result.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/career-profile/experiences");
  redirect("/career-profile/experiences");
}

export async function deleteExperience(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("experiences")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/career-profile/experiences");
  redirect("/career-profile/experiences");
}
