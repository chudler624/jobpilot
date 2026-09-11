import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardCounts } from "@/lib/applications/dashboard-counts";

const CARDS = [
  { key: "newOpportunities", label: "New opportunities", href: "/jobs" },
  { key: "strongMatches", label: "Strong matches", href: "/jobs" },
  { key: "readyToApply", label: "Ready to apply", href: "/applications" },
  { key: "applied", label: "Applied", href: "/applications" },
  { key: "interviews", label: "Interviews", href: "/applications" },
] as const;

export default async function DashboardPage() {
  const counts = await getDashboardCounts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          A live snapshot of your job search.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {CARDS.map((card) => (
          <Link key={card.key} href={card.href}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="text-3xl">{counts[card.key]}</CardTitle>
                <p className="text-sm text-muted-foreground">{card.label}</p>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
