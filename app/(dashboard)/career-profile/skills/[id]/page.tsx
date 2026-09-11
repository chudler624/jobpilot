import { notFound } from "next/navigation";
import { SkillForm } from "@/components/career-profile/skill-form";
import { createClient } from "@/lib/supabase/server";
import { getEvidenceOptions } from "@/lib/career-profile/get-evidence-options";
import { updateSkill, deleteSkill } from "../actions";

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: skill }, evidenceOptions] = await Promise.all([
    supabase.from("skills").select("*").eq("id", id).single(),
    getEvidenceOptions(),
  ]);

  if (!skill) notFound();

  return (
    <SkillForm
      skill={skill}
      evidenceOptions={evidenceOptions}
      action={updateSkill.bind(null, id)}
      deleteAction={deleteSkill.bind(null, id)}
    />
  );
}
