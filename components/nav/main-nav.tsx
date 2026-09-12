"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/jobs", label: "Jobs" },
  { href: "/applications", label: "Applications" },
  { href: "/resume", label: "Resume" },
  { href: "/career-profile", label: "Career Profile" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" },
] as const;

// Shared by the sidebar and the mobile menu so both read identically.
export function navItemClassName(isActive: boolean) {
  return cn(
    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    // Nav never takes cobalt — the active item is a graphite fill.
    isActive
      ? "bg-foreground text-background"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  );
}

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5 px-3 py-2">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={navItemClassName(pathname === item.href)}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
