import { ProjectForm } from "@/components/career-profile/project-form";
import { createProject } from "../actions";

export default function NewProjectPage() {
  return <ProjectForm action={createProject} />;
}
