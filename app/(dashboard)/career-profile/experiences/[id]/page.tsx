import { notFound } from "next/navigation";
import { ExperienceForm } from "@/components/career-profile/experience-form";
import { AccomplishmentsSection } from "@/components/career-profile/accomplishments-section";
import { createClient } from "@/lib/supabase/server";
import { getEvidenceOptions } from "@/lib/career-profile/get-evidence-options";
import { updateExperience, deleteExperience } from "../actions";

export default async function ExperienceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: experience }, { data: accomplishments }, evidenceOptions] =
    await Promise.all([
      supabase.from("experiences").select("*").eq("id", id).single(),
      supabase
        .from("accomplishments")
        .select("*")
        .eq("experience_id", id)
        .order("created_at"),
      getEvidenceOptions(),
    ]);

  if (!experience) notFound();

  return (
    <div className="space-y-8">
      <ExperienceForm
        experience={experience}
        action={updateExperience.bind(null, id)}
        deleteAction={deleteExperience.bind(null, id)}
      />
      <AccomplishmentsSection
        accomplishments={accomplishments ?? []}
        evidenceOptions={evidenceOptions}
        parent={{ experienceId: id }}
      />
    </div>
  );
}
