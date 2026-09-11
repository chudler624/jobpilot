"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  experienceSchema,
  parseFormData,
  type ActionState,
} from "@/lib/career-profile/schemas";

export async function createExperience(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const result = parseFormData(experienceSchema, formData);
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid experience" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: inserted, error } = await supabase
    .from("experiences")
    .insert({ ...result.data, user_id: user.id })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/career-profile/experiences");
  redirect(`/career-profile/experiences/${inserted.id}`);
}

export async function updateExperience(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const result = parseFormData(experienceSchema, formData);
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid experience" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("experiences")
    .update({ ...result.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

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
