import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/server";
import { updateDisplayName, updateWorkAuthorization } from "./actions";

const SPONSORSHIP_LABELS = {
  "": "Not set",
  yes: "Yes, I require sponsorship",
  no: "No, I don't require sponsorship",
} as const;

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "display_name, email, phone, subscription_status, work_authorization_status, requires_sponsorship"
    )
    .eq("id", user!.id)
    .single();

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-[26px] leading-tight font-medium">Settings</h1>
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
            <label className="text-sm font-medium" htmlFor="phone">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              defaultValue={profile?.phone ?? ""}
              placeholder="For application forms that ask"
              className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <Button type="submit" className="self-start">
              Save
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Work authorization</CardTitle>
          <CardDescription>
            Stored facts, read verbatim by the Application Assistant browser
            extension — never inferred or guessed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateWorkAuthorization} className="flex flex-col gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="work_authorization_status">
                Work authorization status
              </Label>
              <input
                id="work_authorization_status"
                name="work_authorization_status"
                defaultValue={profile?.work_authorization_status ?? ""}
                placeholder="e.g. US Citizen, Green Card, H1B..."
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="requires_sponsorship">Requires sponsorship</Label>
              <Select
                name="requires_sponsorship"
                defaultValue={
                  profile?.requires_sponsorship === true
                    ? "yes"
                    : profile?.requires_sponsorship === false
                      ? "no"
                      : ""
                }
                items={SPONSORSHIP_LABELS}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SPONSORSHIP_LABELS).map(([value, label]) => (
                    <SelectItem key={value || "unset"} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="self-start">
              Save
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
