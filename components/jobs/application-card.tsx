import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GenerateResumeButton } from "@/components/resume/generate-resume-button";
import { STATUS_LABELS } from "@/lib/applications/schemas";
import type { ActionState } from "@/lib/career-profile/schemas";
import type { Database } from "@/types/supabase";

type Application = Database["public"]["Tables"]["applications"]["Row"];

export function ApplicationCard({
  application,
  action,
}: {
  application: Application | null;
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Application</CardTitle>
        <CardDescription>Track this job in your pipeline.</CardDescription>
      </CardHeader>
      <CardContent>
        {application ? (
          <Link href={`/applications/${application.id}`} className="inline-flex items-center gap-2">
            <Badge variant="ink">{STATUS_LABELS[application.status]}</Badge>
            <span className="text-sm underline">View application</span>
          </Link>
        ) : (
          <GenerateResumeButton
            action={action}
            label="Track this application"
            pendingLabel="Adding..."
            variant="outline"
          />
        )}
      </CardContent>
    </Card>
  );
}
