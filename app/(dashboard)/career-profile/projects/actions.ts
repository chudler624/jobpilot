"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  projectSchema,
  parseFormData,
  type ActionState,
} from "@/lib/career-profile/schemas";

export async function createProject(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const result = parseFormData(projectSchema, formData);
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid project" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: inserted, error } = await supabase
    .from("projects")
    .insert({ ...result.data, user_id: user.id })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/career-profile/projects");
  redirect(`/career-profile/projects/${inserted.id}`);
}

export async function updateProject(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const result = parseFormData(projectSchema, formData);
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid project" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("projects")
    .update({ ...result.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/career-profile/projects");
  redirect("/career-profile/projects");
}

export async function deleteProject(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/career-profile/projects");
  redirect("/career-profile/projects");
}
