import { SkillForm } from "@/components/career-profile/skill-form";
import { getEvidenceOptions } from "@/lib/career-profile/get-evidence-options";
import { createSkill } from "../actions";

export default async function NewSkillPage() {
  const evidenceOptions = await getEvidenceOptions();
  return <SkillForm action={createSkill} evidenceOptions={evidenceOptions} />;
}
