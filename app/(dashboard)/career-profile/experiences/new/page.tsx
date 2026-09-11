import { ExperienceForm } from "@/components/career-profile/experience-form";
import { createExperience } from "../actions";

export default function NewExperiencePage() {
  return <ExperienceForm action={createExperience} />;
}
