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

export default async function EvidencePage() {
  const supabase = await createClient();
  const { data: evidence } = await supabase
    .from("evidence")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <Link href="/career-profile/evidence/new" className={buttonVariants()}>
        Add evidence
      </Link>

      {!evidence?.length && (
        <p className="text-sm text-muted-foreground">
          No evidence yet. This bank backs your skills and accomplishments —
          add an entry whenever you have a concrete story to draw on.
        </p>
      )}

      <div className="grid gap-4">
        {evidence?.map((entry) => (
          <Link key={entry.id} href={`/career-profile/evidence/${entry.id}`}>
            <Card className="transition-colors hover:bg-secondary">
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>{entry.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {entry.result}
                  </CardDescription>
                </div>
                {entry.verified && <Badge variant="secondary">Verified</Badge>}
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
