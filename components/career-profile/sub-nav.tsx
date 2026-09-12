"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/career-profile/experiences", label: "Experiences" },
  { href: "/career-profile/projects", label: "Projects" },
  { href: "/career-profile/skills", label: "Skills" },
  { href: "/career-profile/evidence", label: "Evidence" },
] as const;

export function CareerProfileSubNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-1 border-b pb-2">
      {TABS.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              // Nav never takes cobalt — active is a graphite fill.
              isActive
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
