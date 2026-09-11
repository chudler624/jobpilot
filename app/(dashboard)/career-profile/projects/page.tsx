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

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <Link href="/career-profile/projects/new" className={buttonVariants()}>
        Add project
      </Link>

      {!projects?.length && (
        <p className="text-sm text-muted-foreground">
          No projects yet. Add your first one to get started.
        </p>
      )}

      <div className="grid gap-4">
        {projects?.map((project) => (
          <Link
            key={project.id}
            href={`/career-profile/projects/${project.id}`}
          >
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
                {(project.start_date || project.end_date) && (
                  <CardDescription>
                    {project.start_date ?? "?"} —{" "}
                    {project.end_date ?? "Present"}
                  </CardDescription>
                )}
              </CardHeader>
              {project.technologies.length > 0 && (
                <CardContent className="flex flex-wrap gap-1.5">
                  {project.technologies.map((tech) => (
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
