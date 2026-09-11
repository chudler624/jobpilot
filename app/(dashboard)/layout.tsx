import { MainNav } from "@/components/nav/main-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1">
      <aside className="w-56 shrink-0 border-r">
        <div className="px-4 py-4 text-lg font-semibold">jobpilot</div>
        <MainNav />
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
