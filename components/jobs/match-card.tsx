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

const RECOMMENDATION_VARIANT = {
  apply: "default",
  apply_stretch: "secondary",
  maybe: "outline",
  skip: "destructive",
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
    <div className="space-y-2">
      <h4 className="text-sm font-medium">{title}</h4>
      <ul className="space-y-2">
        {matches.map((match) => (
          <li key={match.id} className="rounded-md border p-2.5 text-sm">
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium">{match.requirement_text}</span>
              <Badge variant={STATUS_VARIANT[match.status]}>{match.status}</Badge>
            </div>
            <p className="mt-1 text-muted-foreground">{match.rationale}</p>
            {citationLabel(match, labels) && (
              <p className="mt-1 text-xs text-muted-foreground">
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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Match</CardTitle>
          <CardDescription>
            How this job stacks up against your Career Profile.
          </CardDescription>
        </div>
        {score && (
          <Badge variant={RECOMMENDATION_VARIANT[score.recommendation]}>
            {RECOMMENDATION_LABELS[score.recommendation]}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {score && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3">
            {DIMENSION_LABELS.map(({ key, label }) => (
              <div key={key} className="flex justify-between gap-2">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">
                  {formatPercent(score[key] as number | null)}
                </span>
              </div>
            ))}
          </div>
        )}

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
          <details className="space-y-3">
            <summary className="cursor-pointer text-sm font-medium">
              Why you match
            </summary>
            <div className="mt-3 space-y-4">
              <MatchGroup title="Strong" matches={strong} labels={citationLabels} />
              <MatchGroup title="Partial" matches={partial} labels={citationLabels} />
              <MatchGroup title="Missing" matches={missing} labels={citationLabels} />
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
