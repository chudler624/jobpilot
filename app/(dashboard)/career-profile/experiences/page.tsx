import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function ExperiencesPage() {
  const supabase = await createClient();
  const { data: experiences } = await supabase
    .from("experiences")
    .select("*")
    .order("start_date", { ascending: false });

  return (
    <div className="space-y-4">
      <Link
        href="/career-profile/experiences/new"
        className={buttonVariants()}
      >
        Add experience
      </Link>

      {!experiences?.length && (
        <p className="text-sm text-muted-foreground">
          No experiences yet. Add your first one to get started.
        </p>
      )}

      <div className="grid gap-4">
        {experiences?.map((experience) => (
          <Link
            key={experience.id}
            href={`/career-profile/experiences/${experience.id}`}
          >
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle>
                  {experience.title} · {experience.company}
                </CardTitle>
                <CardDescription>
                  {experience.start_date} —{" "}
                  {experience.end_date ?? "Present"}
                  {experience.location ? ` · ${experience.location}` : ""}
                </CardDescription>
              </CardHeader>
              {experience.technologies.length > 0 && (
                <CardContent className="flex flex-wrap gap-1.5">
                  {experience.technologies.map((tech) => (
                    <Badge key={tech} variant="secondary">
                      {tech}
                    </Badge>
                  ))}
                </CardContent>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
