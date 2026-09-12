import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

const STRENGTH_VARIANT = {
  direct: "default",
  adjacent: "secondary",
  limited: "outline",
  none: "outline",
} as const;

export default async function SkillsPage() {
  const supabase = await createClient();
  const { data: skills } = await supabase
    .from("skills")
    .select("*")
    .order("name");

  return (
    <div className="space-y-4">
      <Link href="/career-profile/skills/new" className={buttonVariants()}>
        Add skill
      </Link>

      {!skills?.length && (
        <p className="text-sm text-muted-foreground">
          No skills yet. Add one and tag how strongly you can back it up.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {skills?.map((skill) => (
          <Link key={skill.id} href={`/career-profile/skills/${skill.id}`}>
            <Card className="transition-colors hover:bg-secondary">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">{skill.name}</CardTitle>
                <Badge variant={STRENGTH_VARIANT[skill.evidence_strength]}>
                  {skill.evidence_strength}
                </Badge>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
