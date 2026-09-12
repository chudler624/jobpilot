"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS, navItemClassName } from "@/components/nav/main-nav";

// Below lg the 224px sidebar would eat most of the viewport, so it's
// replaced by a top bar with a text disclosure — no icons, matching the
// rest of the system. The sign-out form is passed in from the server
// layout so the action stays where it already lived.
export function MobileNav({
  email,
  children,
}: {
  email?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-0 z-20 border-b border-sidebar-border bg-sidebar lg:hidden">
      <div className="flex items-center justify-between px-5 py-3">
        <Link href="/dashboard" aria-label="jobpilot">
          <Image
            src="/logo.png"
            alt="jobpilot"
            width={64}
            height={24}
            priority
            className="h-6 w-auto"
          />
        </Link>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </Button>
      </div>

      {open && (
        <div className="border-t border-sidebar-border pb-3">
          <nav className="flex flex-col gap-0.5 px-3 py-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                // Close on navigate, so the menu never covers the page
                // you just asked for.
                onClick={() => setOpen(false)}
                className={navItemClassName(pathname === item.href)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-1 border-t border-border px-5 pt-3">
            <p className="truncate text-xs text-muted-foreground">{email}</p>
            <div className="mt-2">{children}</div>
          </div>
        </div>
      )}
    </div>
  );
}
