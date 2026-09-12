import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { StatusSelect } from "@/components/applications/status-select";
import { AddContactForm } from "@/components/applications/add-contact-form";
import { AddInterviewForm } from "@/components/applications/add-interview-form";
import { AddFollowUpForm } from "@/components/applications/add-follow-up-form";
import { FollowUpItem } from "@/components/applications/follow-up-item";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABELS } from "@/lib/applications/schemas";
import { changeApplicationStatus, deleteApplication } from "../actions";
import {
  createContact,
  deleteContact,
  createInterview,
  deleteInterview,
  createFollowUp,
} from "./child-actions";

function formatPercent(value: number | null): string {
  if (value === null) return "n/a";
  return `${Math.round(value * 100)}%`;
}

export default async function ApplicationDetailPage({
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

  const [
    { data: job },
    { data: score },
    { data: resumeVersions },
    { data: history },
    { data: contacts },
    { data: interviews },
    { data: followUps },
  ] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", application.job_id).single(),
    supabase
      .from("job_scores")
      .select("overall_score, recommendation")
      .eq("job_id", application.job_id)
      .maybeSingle(),
    supabase
      .from("resume_versions")
      .select("id, label, version_number, status")
      .eq("job_id", application.job_id)
      .order("version_number", { ascending: false }),
    supabase
      .from("application_status_history")
      .select("*")
      .eq("application_id", id)
      .order("changed_at", { ascending: false }),
    supabase.from("contacts").select("*").eq("application_id", id).order("created_at"),
    supabase
      .from("interviews")
      .select("*")
      .eq("application_id", id)
      .order("scheduled_at", { ascending: true, nullsFirst: false }),
    supabase.from("follow_ups").select("*").eq("application_id", id).order("due_date"),
  ]);

  const resumeVersion = resumeVersions?.find((v) => v.id === application.resume_version_id);
  const contactList = contacts ?? [];

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] leading-tight font-medium">
            {job?.title ?? "Untitled role"}
            {job?.company ? ` · ${job.company}` : ""}
          </h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            {job?.location ?? "Location unknown"}
            {score && (
              <>
                {" "}
                · Match: {formatPercent(score.overall_score)} (
                {formatPercent(application.match_score_at_creation)} when tracked)
              </>
            )}
          </p>
        </div>
        <Link href={`/jobs/${job?.id}`} className={buttonVariants({ variant: "outline" })}>
          View job
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatusSelect
            currentStatus={application.status}
            action={changeApplicationStatus.bind(null, application.id)}
          />
          {history && history.length > 0 && (
            <details>
              <summary className="cursor-pointer text-sm font-medium">History</summary>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {history.map((h) => (
                  <li key={h.id}>
                    {new Date(h.changed_at).toLocaleString()} — {STATUS_LABELS[h.status]}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <span className="font-medium">Resume version used: </span>
            {resumeVersion ? (
              <Link href={`/resume/${resumeVersion.id}`} className="underline">
                {resumeVersion.label} (v{resumeVersion.version_number})
              </Link>
            ) : (
              <span className="text-muted-foreground">None selected</span>
            )}
            {resumeVersion?.status === "draft" && (
              <p className="mt-1 text-xs text-destructive">
                This resume is still a Draft — review it before you apply.{" "}
                <Link href={`/resume/${resumeVersion.id}/review`} className="underline">
                  Review it
                </Link>
                .
              </p>
            )}
          </div>
          {application.salary_notes && (
            <p>
              <span className="font-medium">Salary notes: </span>
              {application.salary_notes}
            </p>
          )}
          {application.why_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {application.why_tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          {application.cover_letter_text && (
            <details>
              <summary className="cursor-pointer text-sm font-medium">Cover letter</summary>
              <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                {application.cover_letter_text}
              </p>
            </details>
          )}
          <Link href={`/applications/${application.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Edit details
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {contactList.length > 0 && (
            <ul className="space-y-2 text-sm">
              {contactList.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 rounded-md border p-2">
                  <div>
                    <p className="font-medium">
                      {c.name}
                      {c.role ? ` — ${c.role}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[c.email, c.phone, c.linkedin_url].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <form action={deleteContact.bind(null, application.id, c.id)}>
                    <button type="submit" className="text-xs text-muted-foreground underline">
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <AddContactForm action={createContact.bind(null, application.id)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interviews</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {interviews && interviews.length > 0 && (
            <ul className="space-y-2 text-sm">
              {interviews.map((iv) => (
                <li key={iv.id} className="rounded-md border p-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">
                      {iv.interview_type ?? "Interview"}
                      {iv.scheduled_at
                        ? ` — ${new Date(iv.scheduled_at).toLocaleString()}`
                        : ""}
                    </p>
                    <form action={deleteInterview.bind(null, application.id, iv.id)}>
                      <button type="submit" className="text-xs text-muted-foreground underline">
                        Remove
                      </button>
                    </form>
                  </div>
                  {iv.notes && <p className="text-muted-foreground">{iv.notes}</p>}
                  {iv.outcome && (
                    <p className="text-muted-foreground">
                      <span className="font-medium">Outcome: </span>
                      {iv.outcome}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
          <AddInterviewForm
            contacts={contactList.map((c) => ({ id: c.id, name: c.name }))}
            action={createInterview.bind(null, application.id)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Follow-ups</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {followUps && followUps.length > 0 && (
            <ul className="space-y-2">
              {followUps.map((f) => (
                <FollowUpItem
                  key={f.id}
                  applicationId={application.id}
                  followUpId={f.id}
                  note={f.note}
                  dueDate={f.due_date}
                  initialCompleted={f.completed}
                />
              ))}
            </ul>
          )}
          <AddFollowUpForm action={createFollowUp.bind(null, application.id)} />
        </CardContent>
      </Card>

      <form action={deleteApplication.bind(null, application.id)}>
        <ConfirmSubmitButton confirmMessage="Stop tracking this application? This can't be undone.">
          Delete application
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
