import { supabase } from "./supabase";
import type { Database } from "../../../types/supabase";

export type Experience = Database["public"]["Tables"]["experiences"]["Row"];
export type Accomplishment = Database["public"]["Tables"]["accomplishments"]["Row"];
export type Skill = Database["public"]["Tables"]["skills"]["Row"];
export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type Evidence = Database["public"]["Tables"]["evidence"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface CareerProfile {
  profile: Profile | null;
  experiences: Experience[];
  accomplishments: Accomplishment[];
  skills: Skill[];
  projects: ProjectRow[];
  evidence: Evidence[];
}

// Read-only, scoped by RLS exactly like every other client of this
// database — no new authorization surface, no write access at all in
// this phase (see DECISIONS.md ADR-015).
export async function fetchCareerProfile(): Promise<CareerProfile> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { profile: null, experiences: [], accomplishments: [], skills: [], projects: [], evidence: [] };
  }

  const [
    { data: profile },
    { data: experiences },
    { data: accomplishments },
    { data: skills },
    { data: projects },
    { data: evidence },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("experiences").select("*"),
    supabase.from("accomplishments").select("*"),
    supabase.from("skills").select("*"),
    supabase.from("projects").select("*"),
    supabase.from("evidence").select("*"),
  ]);

  return {
    profile: profile ?? null,
    experiences: experiences ?? [],
    accomplishments: accomplishments ?? [],
    skills: skills ?? [],
    projects: projects ?? [],
    evidence: evidence ?? [],
  };
}
