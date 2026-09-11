import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { EvidencePicker } from "@/components/career-profile/evidence-picker";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import {
  createAccomplishment,
  updateAccomplishment,
  deleteAccomplishment,
} from "@/app/(dashboard)/career-profile/accomplishments/actions";
import type { Database } from "@/types/supabase";

type Accomplishment = Database["public"]["Tables"]["accomplishments"]["Row"];
type Parent = { experienceId: string } | { projectId: string };

export function AccomplishmentsSection({
  accomplishments,
  evidenceOptions,
  parent,
}: {
  accomplishments: Accomplishment[];
  evidenceOptions: { id: string; title: string }[];
  parent: Parent;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Accomplishments</h2>

      {accomplishments.map((accomplishment) => (
        <Card key={accomplishment.id}>
          <CardContent className="space-y-3">
            <form
              action={updateAccomplishment.bind(
                null,
                accomplishment.id,
                parent
              )}
              className="space-y-3"
            >
              <Textarea
                name="description"
                required
                rows={2}
                defaultValue={accomplishment.description}
              />
              <EvidencePicker
                evidenceOptions={evidenceOptions}
                defaultValue={accomplishment.evidence_id}
              />
              <Button type="submit" size="sm">
                Save
              </Button>
            </form>
            <form
              action={deleteAccomplishment.bind(
                null,
                accomplishment.id,
                parent
              )}
            >
              <ConfirmSubmitButton confirmMessage="Delete this accomplishment?">
                Delete
              </ConfirmSubmitButton>
            </form>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardContent>
          <form
            action={createAccomplishment.bind(null, parent)}
            className="space-y-3"
          >
            <Label htmlFor="new-accomplishment-description">
              Add an accomplishment
            </Label>
            <Textarea
              id="new-accomplishment-description"
              name="description"
              required
              rows={2}
              placeholder="What did you accomplish here?"
            />
            <EvidencePicker evidenceOptions={evidenceOptions} />
            <Button type="submit" size="sm">
              Add accomplishment
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
