import { notFound } from "next/navigation";
import { EditApplicationForm } from "@/components/applications/edit-application-form";
import { createClient } from "@/lib/supabase/server";
import { updateApplication } from "../../actions";

export default async function EditApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: application } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .single();
  if (!application) notFound();

  const { data: resumeVersions } = await supabase
    .from("resume_versions")
    .select("id, label, version_number")
    .eq("job_id", application.job_id)
    .order("version_number", { ascending: false });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Edit application</h1>
      <EditApplicationForm
        application={application}
        resumeVersions={resumeVersions ?? []}
        action={updateApplication.bind(null, id)}
      />
    </div>
  );
}
