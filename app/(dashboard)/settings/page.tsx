import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { updateDisplayName } from "./actions";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email, subscription_status")
    .eq("id", user!.id)
    .single();

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            This is the Phase 0 proof that reads and writes travel through
            Supabase, scoped to your own row via RLS.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateDisplayName} className="flex flex-col gap-3">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              value={profile?.email ?? ""}
              disabled
              className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground"
            />
            <label className="text-sm font-medium" htmlFor="display_name">
              Display name
            </label>
            <input
              id="display_name"
              name="display_name"
              defaultValue={profile?.display_name ?? ""}
              placeholder="What should we call you?"
              className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <Button type="submit" className="self-start">
              Save
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
