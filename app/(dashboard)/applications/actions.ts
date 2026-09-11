"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseFormData, type ActionState } from "@/lib/career-profile/schemas";
import { applicationEditSchema, statusChangeSchema } from "@/lib/applications/schemas";

export async function createApplication(
  jobId: string,
  _prevState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: job } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", jobId)
    .single();
  if (!job) return { error: "Job not found" };

  const { data: score } = await supabase
    .from("job_scores")
    .select("overall_score")
    .eq("job_id", jobId)
    .maybeSingle();

  const { data: application, error } = await supabase
    .from("applications")
    .insert({
      user_id: user.id,
      job_id: jobId,
      match_score_at_creation: score?.overall_score ?? null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "You're already tracking an application for this job." };
    }
    return { error: error.message };
  }

  await supabase.from("application_status_history").insert({
    user_id: user.id,
    application_id: application.id,
    status: "discovered",
  });

  revalidatePath("/applications");
  revalidatePath(`/jobs/${jobId}`);
  redirect(`/applications/${application.id}`);
}

export async function changeApplicationStatus(
  applicationId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseFormData(statusChangeSchema, formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid status" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("applications")
    .update({ status: parsed.data.status, status_updated_at: now, updated_at: now })
    .eq("id", applicationId)
    .eq("user_id", user.id);

  if (updateError) return { error: updateError.message };

  const { error: historyError } = await supabase
    .from("application_status_history")
    .insert({
      user_id: user.id,
      application_id: applicationId,
      status: parsed.data.status,
      note: parsed.data.note,
      changed_at: now,
    });

  if (historyError) return { error: historyError.message };

  revalidatePath(`/applications/${applicationId}`);
  revalidatePath("/applications");
  return {};
}

export async function updateApplication(
  applicationId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseFormData(applicationEditSchema, formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("applications")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", applicationId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/applications/${applicationId}`);
  redirect(`/applications/${applicationId}`);
}

export async function deleteApplication(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/applications");
  redirect("/applications");
}
