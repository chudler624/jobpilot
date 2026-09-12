import { AccomplishmentEditForm } from "@/components/career-profile/accomplishment-edit-form";
import { AccomplishmentAddForm } from "@/components/career-profile/accomplishment-add-form";
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
      <h2 className="text-lg font-medium">Accomplishments</h2>

      {accomplishments.map((accomplishment) => (
        <AccomplishmentEditForm
          key={accomplishment.id}
          accomplishment={accomplishment}
          evidenceOptions={evidenceOptions}
          parent={parent}
        />
      ))}

      <AccomplishmentAddForm evidenceOptions={evidenceOptions} parent={parent} />
    </div>
  );
}
