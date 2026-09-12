import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/applications/schemas";

export default async function ApplicationsPage() {
  const supabase = await createClient();
  const [{ data: applications }, { data: jobs }] = await Promise.all([
    supabase.from("applications").select("*").order("status_updated_at", { ascending: false }),
    supabase.from("jobs").select("id, title, company"),
  ]);

  const jobLookup = new Map((jobs ?? []).map((j) => [j.id, j]));
  const allApplications = applications ?? [];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] leading-tight font-medium">Applications</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            Your job search pipeline, from discovered to offer.
          </p>
        </div>
        <Link href="/applications/new" className={buttonVariants()}>
          Track a job
        </Link>
      </div>

      {allApplications.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No applications tracked yet.
        </p>
      )}

      <div className="space-y-6">
        {STATUS_ORDER.map((status) => {
          const group = allApplications.filter((a) => a.status === status);
          if (group.length === 0) return null;
          return (
            <div key={status} className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">
                {STATUS_LABELS[status]} ({group.length})
              </h2>
              <div className="grid gap-2">
                {group.map((application) => {
                  const job = jobLookup.get(application.job_id);
                  return (
                    <Link key={application.id} href={`/applications/${application.id}`}>
                      <Card className="transition-colors hover:bg-secondary">
                        <CardHeader className="flex flex-row items-center justify-between">
                          <div>
                            <CardTitle>
                              {job?.title ?? "Untitled role"}
                              {job?.company ? ` · ${job.company}` : ""}
                            </CardTitle>
                            <CardDescription>
                              Updated {new Date(application.status_updated_at).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <Badge variant="ink">{STATUS_LABELS[application.status]}</Badge>
                        </CardHeader>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
