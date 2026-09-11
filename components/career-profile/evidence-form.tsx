import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import type { Database } from "@/types/supabase";

type Evidence = Database["public"]["Tables"]["evidence"]["Row"];

export function EvidenceForm({
  evidence,
  action,
  deleteAction,
}: {
  evidence?: Evidence;
  action: (formData: FormData) => Promise<void>;
  deleteAction?: () => Promise<void>;
}) {
  return (
    <div className="space-y-6">
      <form action={action} className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            required
            placeholder="Short label, e.g. 'Led checkout redesign'"
            defaultValue={evidence?.title}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="problem">Problem</Label>
          <Textarea
            id="problem"
            name="problem"
            required
            rows={3}
            defaultValue={evidence?.problem}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="action">What I did</Label>
          <Textarea
            id="action"
            name="action"
            required
            rows={3}
            defaultValue={evidence?.action}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="result">Result</Label>
          <Textarea
            id="result"
            name="result"
            required
            rows={3}
            defaultValue={evidence?.result}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="verified" defaultChecked={evidence?.verified} />
          Verified (I can back this up if asked)
        </label>
        <Button type="submit" className="self-start">
          {evidence ? "Save changes" : "Add evidence"}
        </Button>
      </form>
      {deleteAction && (
        <form action={deleteAction}>
          <ConfirmSubmitButton confirmMessage="Delete this evidence entry? Skills and accomplishments linking to it will keep their claim but lose the evidence link.">
            Delete evidence
          </ConfirmSubmitButton>
        </form>
      )}
    </div>
  );
}
