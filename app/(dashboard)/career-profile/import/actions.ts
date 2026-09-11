"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai";
import { parseResumeFile } from "@/lib/career-profile/parse-resume-file";
import {
  careerProfileExtractionSchema,
  commitImportSchema,
  type CommitImportPayload,
} from "@/lib/career-profile/import-schemas";
import type { CareerProfileExtraction } from "@/lib/ai";

export type ImportState = {
  error?: string;
  extracted?: CareerProfileExtraction;
};

export async function parseResumeImport(
  _prevState: ImportState,
  formData: FormData
): Promise<ImportState> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "Please choose a file to upload." };
  }

  const parsedFile = await parseResumeFile(file);
  if (!parsedFile.ok) {
    return { error: parsedFile.error };
  }

  let extracted;
  try {
    const provider = getAIProvider();
    extracted = await provider.extractCareerProfile({ rawText: parsedFile.text });
  } catch (err) {
    console.error("extractCareerProfile failed", err);
    return {
      error: "Couldn't analyze that resume. Please try again in a moment.",
    };
  }

  const validated = careerProfileExtractionSchema.safeParse(extracted);
  if (!validated.success) {
    console.error(
      "careerProfileExtractionSchema validation failed",
      JSON.stringify(validated.error.issues, null, 2),
      "raw extraction:",
      JSON.stringify(extracted, null, 2)
    );
    return {
      error: "The AI returned an unexpected format. Please try again.",
    };
  }

  return { extracted: validated.data };
}

export type CommitState = { error?: string };

export async function commitImport(
  payload: CommitImportPayload
): Promise<CommitState> {
  const validated = commitImportSchema.safeParse(payload);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Invalid data" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  for (const experience of validated.data.experiences) {
    const { data: inserted, error } = await supabase
      .from("experiences")
      .insert({
        user_id: user.id,
        company: experience.company,
        title: experience.title,
        location: experience.location,
        start_date: experience.startDate,
        end_date: experience.endDate,
        technologies: experience.technologies,
        description: experience.description,
      })
      .select("id")
      .single();

    if (error) return { error: error.message };

    if (experience.accomplishments.length > 0) {
      const { error: accError } = await supabase.from("accomplishments").insert(
        experience.accomplishments.map((description) => ({
          user_id: user.id,
          experience_id: inserted.id,
          description,
        }))
      );
      if (accError) return { error: accError.message };
    }
  }

  for (const project of validated.data.projects) {
    const { data: inserted, error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name: project.name,
        description: project.description,
        url: project.url,
        technologies: project.technologies,
        start_date: project.startDate,
        end_date: project.endDate,
      })
      .select("id")
      .single();

    if (error) return { error: error.message };

    if (project.accomplishments.length > 0) {
      const { error: accError } = await supabase.from("accomplishments").insert(
        project.accomplishments.map((description) => ({
          user_id: user.id,
          project_id: inserted.id,
          description,
        }))
      );
      if (accError) return { error: accError.message };
    }
  }

  if (validated.data.skills.length > 0) {
    const { data: existingSkills } = await supabase
      .from("skills")
      .select("name");
    const existingNames = new Set(
      (existingSkills ?? []).map((s) => s.name.trim().toLowerCase())
    );
    const newNames = [
      ...new Set(
        validated.data.skills
          .map((name) => name.trim())
          .filter((name) => name && !existingNames.has(name.toLowerCase()))
      ),
    ];

    if (newNames.length > 0) {
      const { error: skillError } = await supabase.from("skills").insert(
        newNames.map((name) => ({
          user_id: user.id,
          name,
          evidence_strength: "none" as const,
        }))
      );
      if (skillError) return { error: skillError.message };
    }
  }

  revalidatePath("/career-profile/experiences");
  redirect("/career-profile/experiences");
}
