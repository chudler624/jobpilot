"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  accomplishmentSchema,
  parseFormData,
  type ActionState,
} from "@/lib/career-profile/schemas";

type Parent = { experienceId: string } | { projectId: string };

function parentPath(parent: Parent) {
  return "experienceId" in parent
    ? `/career-profile/experiences/${parent.experienceId}`
    : `/career-profile/projects/${parent.projectId}`;
}

export async function createAccomplishment(
  parent: Parent,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const result = parseFormData(accomplishmentSchema, formData);
  if (!result.success) {
    return {
      error: result.error.issues[0]?.message ?? "Invalid accomplishment",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase.from("accomplishments").insert({
    ...result.data,
    user_id: user.id,
    experience_id: "experienceId" in parent ? parent.experienceId : null,
    project_id: "projectId" in parent ? parent.projectId : null,
  });

  if (error) return { error: error.message };

  revalidatePath(parentPath(parent));
  return {};
}

export async function updateAccomplishment(
  id: string,
  parent: Parent,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const result = parseFormData(accomplishmentSchema, formData);
  if (!result.success) {
    return {
      error: result.error.issues[0]?.message ?? "Invalid accomplishment",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("accomplishments")
    .update({ ...result.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(parentPath(parent));
  return {};
}

export async function deleteAccomplishment(id: string, parent: Parent) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("accomplishments")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath(parentPath(parent));
}
