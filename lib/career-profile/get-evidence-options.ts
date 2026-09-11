import { createClient } from "@/lib/supabase/server";

export async function getEvidenceOptions() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("evidence")
    .select("id, title")
    .order("title");
  return data ?? [];
}
