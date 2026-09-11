import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JobForm } from "@/components/jobs/job-form";
import { createClient } from "@/lib/supabase/server";
import { updateJob, deleteJob } from "../actions";

function RequirementList({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  if (!items.length) return null;
  return (
    <div className="space-y-1.5">
      <h3 className="text-sm font-medium">{label}</h3>
      <ul className="list-inside list-disc space-y-0.5 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: job }, { data: requirements }] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", id).single(),
    supabase
      .from("job_requirements")
      .select("*")
      .eq("job_id", id)
      .maybeSingle(),
  ]);

  if (!job) notFound();

  return (
    <div className="max-w-2xl space-y-8">
      <JobForm
        job={job}
        action={updateJob.bind(null, id)}
        deleteAction={deleteJob.bind(null, id)}
      />

      {requirements && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {requirements.technologies.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {requirements.technologies.map((tech) => (
                  <Badge key={tech} variant="secondary">
                    {tech}
                  </Badge>
                ))}
              </div>
            )}
            <RequirementList
              label="Responsibilities"
              items={requirements.responsibilities}
            />
            <RequirementList
              label="Required qualifications"
              items={requirements.required_qualifications}
            />
            <RequirementList
              label="Preferred qualifications"
              items={requirements.preferred_qualifications}
            />
            {requirements.experience_requirement && (
              <p className="text-sm">
                <span className="font-medium">Experience: </span>
                {requirements.experience_requirement}
              </p>
            )}
            {requirements.education_requirement && (
              <p className="text-sm">
                <span className="font-medium">Education: </span>
                {requirements.education_requirement}
              </p>
            )}
            <RequirementList label="Keywords" items={requirements.keywords} />
          </CardContent>
        </Card>
      )}

      <details className="rounded-lg border p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Original description{job.source_url ? " (from URL)" : ""}
        </summary>
        <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
          {job.raw_description}
        </pre>
      </details>
    </div>
  );
}
