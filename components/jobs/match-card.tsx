"use client";

import { useActionState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VerifiedMarker } from "@/components/ui/verified-marker";
import type { ActionState } from "@/lib/career-profile/schemas";
import type { Database } from "@/types/supabase";

type JobScore = Database["public"]["Tables"]["job_scores"]["Row"];
type JobScoreMatch = Database["public"]["Tables"]["job_score_matches"]["Row"];

const RECOMMENDATION_LABELS = {
  apply: "Apply",
  apply_stretch: "Apply — Stretch",
  maybe: "Maybe",
  skip: "Skip",
} as const;

// Cobalt fill is earned: only "Apply" gets it. Skip is muted, never red —
// a skip is an ordinary outcome, not an alarm.
const RECOMMENDATION_VARIANT = {
  apply: "default",
  apply_stretch: "outline",
  maybe: "outline",
  skip: "secondary",
} as const;

const DIMENSION_LABELS: { key: keyof JobScore; label: string }[] = [
  { key: "required_skills_score", label: "Required skills" },
  { key: "preferred_skills_score", label: "Preferred skills" },
  { key: "relevant_experience_score", label: "Relevant experience" },
  { key: "seniority_score", label: "Seniority" },
  { key: "industry_domain_score", label: "Industry / domain" },
  { key: "resume_representation_score", label: "Evidence strength" },
];

const STATUS_VARIANT = {
  strong: "default",
  partial: "secondary",
  missing: "outline",
} as const;

function formatPercent(value: number | null): string {
  if (value === null) return "n/a";
  return `${Math.round(value * 100)}%`;
}

function citationLabel(
  match: JobScoreMatch,
  labels: Map<string, string>
): string | null {
  const id =
    match.matched_skill_id ??
    match.matched_experience_id ??
    match.matched_accomplishment_id ??
    match.matched_evidence_id;
  if (!id) return null;
  return labels.get(id) ?? "Unknown";
}

function MatchGroup({
  title,
  matches,
  labels,
}: {
  title: string;
  matches: JobScoreMatch[];
  labels: Map<string, string>;
}) {
  if (matches.length === 0) return null;
  return (
    <div>
      <h4 className="mb-2 text-[13px] font-medium">{title}</h4>
      <ul className="flex flex-col gap-2">
        {matches.map((match) => (
          <li
            key={match.id}
            className="rounded-lg border border-border px-3.5 py-3"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-medium">{match.requirement_text}</span>
              <Badge variant={STATUS_VARIANT[match.status]}>{match.status}</Badge>
            </div>
            <p className="mt-1 text-[13.5px] leading-[1.5] text-muted-foreground">
              {match.rationale}
            </p>
            {citationLabel(match, labels) && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <VerifiedMarker verified className="size-[7px]" />
                Backed by: {citationLabel(match, labels)}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MatchCard({
  score,
  matches,
  citationLabels,
  action,
}: {
  score: JobScore | null;
  matches: JobScoreMatch[];
  citationLabels: Map<string, string>;
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, isPending] = useActionState(action, {});

  const strong = matches.filter((m) => m.status === "strong");
  const partial = matches.filter((m) => m.status === "partial");
  const missing = matches.filter((m) => m.status === "missing");

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-6">
        <div className="max-w-[60ch]">
          <CardTitle>Match</CardTitle>
          <CardDescription className="text-[14.5px] leading-[1.55]">
            How this job stacks up against your Career Profile.
          </CardDescription>
        </div>
        {score && (
          <div className="flex shrink-0 items-center gap-4">
            <div className="text-right">
              <div className="font-mono text-[40px] leading-none font-medium tabular">
                {Math.round(score.overall_score * 100)}
                <span className="text-xl text-muted-foreground">%</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                overall (weighted)
              </div>
            </div>
            <Badge variant={RECOMMENDATION_VARIANT[score.recommendation]}>
              {RECOMMENDATION_LABELS[score.recommendation]}
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        <form action={formAction}>
          <Button type="submit" variant="outline" disabled={isPending}>
            {isPending
              ? "Analyzing..."
              : score
                ? "Re-analyze match"
                : "Analyze match"}
          </Button>
        </form>

        {score && matches.length > 0 && (
          <>
            <hr className="border-border" />
            <details className="group">
              <summary className="cursor-pointer list-none text-sm font-medium text-primary [&::-webkit-details-marker]:hidden">
                <span className="group-open:hidden">View breakdown</span>
                <span className="hidden group-open:inline">Hide breakdown</span>
              </summary>

              <div className="mt-[18px]">
                <h4 className="mb-2 text-[13px] font-medium">Breakdown</h4>
                <div className="grid grid-cols-2 gap-x-8 sm:grid-cols-3">
                  {DIMENSION_LABELS.map(({ key, label }) => (
                    <div
                      key={key}
                      className="flex items-baseline justify-between border-b border-border py-[9px]"
                    >
                      <span className="text-[13.5px] text-muted-foreground">
                        {label}
                      </span>
                      <span className="font-mono text-sm font-medium tabular">
                        {formatPercent(score[key] as number | null)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-col gap-[18px]">
                  <MatchGroup
                    title="Strong"
                    matches={strong}
                    labels={citationLabels}
                  />
                  <MatchGroup
                    title="Partial"
                    matches={partial}
                    labels={citationLabels}
                  />
                  <MatchGroup
                    title="Missing"
                    matches={missing}
                    labels={citationLabels}
                  />
                </div>
              </div>
            </details>
          </>
        )}
      </CardContent>
    </Card>
  );
}
