import Image from "next/image";
import { MainNav } from "@/components/nav/main-nav";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-full flex-1">
      <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="px-5 pt-5 pb-4">
          <Image
            src="/logo.png"
            alt="jobpilot"
            width={64}
            height={24}
            priority
            className="h-6 w-auto"
          />
        </div>
        <MainNav />
        <div className="mt-auto border-t border-border p-4">
          <p className="truncate text-xs text-muted-foreground">
            {user?.email}
          </p>
          <form action={signOut}>
            <Button variant="outline" size="sm" className="mt-2 w-full">
              Sign out
            </Button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-12 py-10">
        <div className="max-w-[1000px]">{children}</div>
      </main>
    </div>
  );
}
