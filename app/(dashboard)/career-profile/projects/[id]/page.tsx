import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/career-profile/project-form";
import { AccomplishmentsSection } from "@/components/career-profile/accomplishments-section";
import { createClient } from "@/lib/supabase/server";
import { getEvidenceOptions } from "@/lib/career-profile/get-evidence-options";
import { updateProject, deleteProject } from "../actions";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: project }, { data: accomplishments }, evidenceOptions] =
    await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase
        .from("accomplishments")
        .select("*")
        .eq("project_id", id)
        .order("created_at"),
      getEvidenceOptions(),
    ]);

  if (!project) notFound();

  return (
    <div className="space-y-8">
      <ProjectForm
        project={project}
        action={updateProject.bind(null, id)}
        deleteAction={deleteProject.bind(null, id)}
      />
      <AccomplishmentsSection
        accomplishments={accomplishments ?? []}
        evidenceOptions={evidenceOptions}
        parent={{ projectId: id }}
      />
    </div>
  );
}
