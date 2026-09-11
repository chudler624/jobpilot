import { notFound } from "next/navigation";
import { EvidenceForm } from "@/components/career-profile/evidence-form";
import { createClient } from "@/lib/supabase/server";
import { updateEvidence, deleteEvidence } from "../actions";

export default async function EvidenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: evidence } = await supabase
    .from("evidence")
    .select("*")
    .eq("id", id)
    .single();

  if (!evidence) notFound();

  return (
    <EvidenceForm
      evidence={evidence}
      action={updateEvidence.bind(null, id)}
      deleteAction={deleteEvidence.bind(null, id)}
    />
  );
}
