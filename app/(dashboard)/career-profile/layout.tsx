import Link from "next/link";
import { CareerProfileSubNav } from "@/components/career-profile/sub-nav";
import { buttonVariants } from "@/components/ui/button";

export default function CareerProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] leading-tight font-medium">Career Profile</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            The verified source of truth everything else in jobpilot will
            eventually read from.
          </p>
        </div>
        <Link
          href="/career-profile/import"
          className={buttonVariants({ variant: "outline" })}
        >
          Import from resume
        </Link>
      </div>
      <CareerProfileSubNav />
      {children}
    </div>
  );
}
