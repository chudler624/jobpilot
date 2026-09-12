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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
