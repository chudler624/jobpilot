"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateDisplayName(formData: FormData) {
  const displayName = String(formData.get("display_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await supabase
    .from("profiles")
    .update({ display_name: displayName || null, phone: phone || null })
    .eq("id", user.id);

  revalidatePath("/settings");
}

export async function updateWorkAuthorization(formData: FormData) {
  const status = String(formData.get("work_authorization_status") ?? "").trim();
  const sponsorship = formData.get("requires_sponsorship");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await supabase
    .from("profiles")
    .update({
      work_authorization_status: status || null,
      requires_sponsorship: sponsorship === "" ? null : sponsorship === "yes",
    })
    .eq("id", user.id);

  revalidatePath("/settings");
}
