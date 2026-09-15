import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { JobForm } from "@/components/jobs/job-form";
import { MatchCard } from "@/components/jobs/match-card";
import { ResumeCard } from "@/components/jobs/resume-card";
import { ApplicationCard } from "@/components/jobs/application-card";
import { createClient } from "@/lib/supabase/server";
import { updateJob, deleteJob, analyzeMatch } from "../actions";
import { generateResume } from "@/app/(dashboard)/resume/actions";
import { createApplication } from "@/app/(dashboard)/applications/actions";

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
  const [
    { data: job },
    { data: requirements },
    { data: score },
    { data: skills },
    { data: experiences },
    { data: accomplishments },
    { data: evidence },
    { data: resumeVersions },
    { data: application },
  ] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", id).single(),
    supabase
      .from("job_requirements")
      .select("*")
      .eq("job_id", id)
      .maybeSingle(),
    supabase.from("job_scores").select("*").eq("job_id", id).maybeSingle(),
    supabase.from("skills").select("id, name"),
    supabase.from("experiences").select("id, company, title"),
    supabase.from("accomplishments").select("id, description"),
    supabase.from("evidence").select("id, title"),
    supabase
      .from("resume_versions")
      .select("*")
      .eq("job_id", id)
      .order("version_number", { ascending: false }),
    supabase.from("applications").select("*").eq("job_id", id).maybeSingle(),
  ]);

  if (!job) notFound();

  const { data: matches } = score
    ? await supabase
        .from("job_score_matches")
        .select("*")
        .eq("job_score_id", score.id)
        .order("requirement_type")
    : { data: [] };

  const citationLabels = new Map<string, string>();
  for (const s of skills ?? []) citationLabels.set(s.id, `Skill: ${s.name}`);
  for (const e of experiences ?? [])
    citationLabels.set(e.id, `Experience: ${e.title} at ${e.company}`);
  for (const a of accomplishments ?? [])
    citationLabels.set(a.id, `Accomplishment: ${a.description.slice(0, 60)}`);
  for (const ev of evidence ?? [])
    citationLabels.set(ev.id, `Evidence: ${ev.title}`);

  return (
    <div className="max-w-2xl space-y-8">
      <JobForm
        job={job}
        action={updateJob.bind(null, id)}
        deleteAction={deleteJob.bind(null, id)}
      />

      {job.source_url && (
        <a
          href={job.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          View original listing
        </a>
      )}

      <MatchCard
        score={score ?? null}
        matches={matches ?? []}
        citationLabels={citationLabels}
        action={analyzeMatch.bind(null, id)}
      />

      <ResumeCard
        versions={resumeVersions ?? []}
        score={score ?? null}
        action={generateResume.bind(null, id)}
      />

      <ApplicationCard
        application={application ?? null}
        action={createApplication.bind(null, id)}
      />

      {requirements && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted requirements</CardTitle>
            {job.is_snippet_only && (
              <CardDescription>
                This job&apos;s description is a short snippet, not the full
                posting — extraction is thinner than usual as a result, not
                a bug. Click &quot;View original listing&quot; above to read
                the real posting.
              </CardDescription>
            )}
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
