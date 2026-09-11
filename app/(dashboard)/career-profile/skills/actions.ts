"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  skillSchema,
  parseFormData,
  type ActionState,
} from "@/lib/career-profile/schemas";

export async function createSkill(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const result = parseFormData(skillSchema, formData);
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid skill" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("skills")
    .insert({ ...result.data, user_id: user.id });

  if (error) return { error: error.message };

  revalidatePath("/career-profile/skills");
  redirect("/career-profile/skills");
}

export async function updateSkill(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const result = parseFormData(skillSchema, formData);
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid skill" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("skills")
    .update({ ...result.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/career-profile/skills");
  redirect("/career-profile/skills");
}

export async function deleteSkill(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("skills")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/career-profile/skills");
  redirect("/career-profile/skills");
}
