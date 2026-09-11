import { CareerProfileSubNav } from "@/components/career-profile/sub-nav";

export default function CareerProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Career Profile</h1>
        <p className="text-muted-foreground">
          The verified source of truth everything else in jobpilot will
          eventually read from.
        </p>
      </div>
      <CareerProfileSubNav />
      {children}
    </div>
  );
}
