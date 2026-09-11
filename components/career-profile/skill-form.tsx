import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EvidencePicker } from "@/components/career-profile/evidence-picker";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import type { Database } from "@/types/supabase";

type Skill = Database["public"]["Tables"]["skills"]["Row"];

const STRENGTH_LABELS = {
  direct: "Direct",
  adjacent: "Adjacent",
  limited: "Limited",
  none: "None",
} as const;

export function SkillForm({
  skill,
  evidenceOptions,
  action,
  deleteAction,
}: {
  skill?: Skill;
  evidenceOptions: { id: string; title: string }[];
  action: (formData: FormData) => Promise<void>;
  deleteAction?: () => Promise<void>;
}) {
  return (
    <div className="space-y-6">
      <form action={action} className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required defaultValue={skill?.name} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="evidence_strength">Evidence strength</Label>
          <Select
            name="evidence_strength"
            defaultValue={skill?.evidence_strength ?? "none"}
            required
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STRENGTH_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="evidence_id">Evidence</Label>
          <EvidencePicker
            evidenceOptions={evidenceOptions}
            defaultValue={skill?.evidence_id}
          />
          <p className="text-xs text-muted-foreground">
            Required if evidence strength is &quot;Direct&quot;.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={skill?.notes ?? ""}
          />
        </div>
        <Button type="submit" className="self-start">
          {skill ? "Save changes" : "Add skill"}
        </Button>
      </form>
      {deleteAction && (
        <form action={deleteAction}>
          <ConfirmSubmitButton confirmMessage="Delete this skill?">
            Delete skill
          </ConfirmSubmitButton>
        </form>
      )}
    </div>
  );
}
