import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getDashboardCounts } from "@/lib/applications/dashboard-counts";

const CARDS = [
  { key: "newOpportunities", label: "New opportunities", href: "/jobs" },
  { key: "strongMatches", label: "Strong matches", href: "/jobs" },
  { key: "readyToApply", label: "Ready to apply", href: "/applications" },
  { key: "applied", label: "Applied", href: "/applications" },
  { key: "interviews", label: "Interviews", href: "/applications" },
] as const;

const RECOMMENDATION_LABELS = {
  apply: "Apply",
  apply_stretch: "Apply — Stretch",
  maybe: "Maybe",
  skip: "Skip",
} as const;

// Cobalt fill is reserved for "Apply"; everything else is outline or muted.
const RECOMMENDATION_VARIANT = {
  apply: "default",
  apply_stretch: "outline",
  maybe: "outline",
  skip: "secondary",
} as const;

export default async function DashboardPage() {
  const supabase = await createClient();
  const [counts, { data: scores }] = await Promise.all([
    getDashboardCounts(),
    supabase
      .from("job_scores")
      .select("job_id, overall_score, recommendation")
      .order("overall_score", { ascending: false })
      .limit(3),
  ]);

  const topScores = scores ?? [];
  const { data: topJobs } = topScores.length
    ? await supabase
        .from("jobs")
        .select("id, title, company, location")
        .in(
          "id",
          topScores.map((s) => s.job_id)
        )
    : { data: [] };

  const jobLookup = new Map((topJobs ?? []).map((j) => [j.id, j]));

  return (
    <div>
      <h1 className="text-[26px] leading-tight font-medium">Dashboard</h1>
      <p className="mt-1 text-[15px] text-muted-foreground">
        A live snapshot of your job search.
      </p>

      <div className="mt-7 grid grid-cols-5 gap-3">
        {CARDS.map((card) => (
          <Link key={card.key} href={card.href}>
            <Card className="gap-0 px-4 py-[18px]">
              <div className="font-mono text-[32px] leading-none font-medium tabular">
                {counts[card.key]}
              </div>
              <div className="mt-2 text-[13px] text-muted-foreground">
                {card.label}
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {topScores.length > 0 && (
        <>
          <h2 className="mt-10 mb-3.5 text-base font-medium">
            Top opportunities
          </h2>
          <div className="flex flex-col gap-3">
            {topScores.map((score) => {
              const job = jobLookup.get(score.job_id);
              if (!job) return null;
              return (
                <Link key={score.job_id} href={`/jobs/${score.job_id}`}>
                  <Card className="flex-row items-center justify-between gap-4 px-[18px] transition-colors hover:bg-secondary">
                    <div className="min-w-0">
                      <div className="text-base font-medium">
                        {job.title ?? "Untitled role"}
                      </div>
                      <div className="mt-[3px] text-[13.5px] text-muted-foreground">
                        {[job.company, job.location].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <Badge variant={RECOMMENDATION_VARIANT[score.recommendation]}>
                        {RECOMMENDATION_LABELS[score.recommendation]}
                      </Badge>
                      <span className="min-w-10 text-right font-mono text-[28px] font-medium tabular">
                        {Math.round(score.overall_score * 100)}
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
