"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  accomplishmentSchema,
  parseFormData,
} from "@/lib/career-profile/schemas";

type Parent = { experienceId: string } | { projectId: string };

function parentPath(parent: Parent) {
  return "experienceId" in parent
    ? `/career-profile/experiences/${parent.experienceId}`
    : `/career-profile/projects/${parent.projectId}`;
}

export async function createAccomplishment(parent: Parent, formData: FormData) {
  const result = parseFormData(accomplishmentSchema, formData);
  if (!result.success) {
    throw new Error(
      result.error.issues[0]?.message ?? "Invalid accomplishment"
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("accomplishments").insert({
    ...result.data,
    user_id: user.id,
    experience_id: "experienceId" in parent ? parent.experienceId : null,
    project_id: "projectId" in parent ? parent.projectId : null,
  });

  if (error) throw new Error(error.message);

  revalidatePath(parentPath(parent));
}

export async function updateAccomplishment(
  id: string,
  parent: Parent,
  formData: FormData
) {
  const result = parseFormData(accomplishmentSchema, formData);
  if (!result.success) {
    throw new Error(
      result.error.issues[0]?.message ?? "Invalid accomplishment"
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("accomplishments")
    .update({ ...result.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath(parentPath(parent));
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
