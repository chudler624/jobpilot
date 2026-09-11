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
      <aside className="flex w-56 shrink-0 flex-col border-r">
        <div className="px-4 py-4 text-lg font-semibold">jobpilot</div>
        <MainNav />
        <div className="mt-auto border-t p-4">
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
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
