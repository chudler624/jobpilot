import { EvidenceForm } from "@/components/career-profile/evidence-form";
import { createEvidence } from "../actions";

export default function NewEvidencePage() {
  return <EvidenceForm action={createEvidence} />;
}
