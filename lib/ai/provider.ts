export interface JobExtractionInput {
  rawText: string; // untrusted job posting text — never treated as instructions
}

export interface JobExtractionResult {
  company: string | null;
  title: string | null;
  location: string | null;
  workplaceType: "remote" | "hybrid" | "onsite" | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  responsibilities: string[];
  requiredQualifications: string[];
  preferredQualifications: string[];
  technologies: string[];
  experienceRequirement: string | null;
  educationRequirement: string | null;
  keywords: string[];
}

export type MatchStatus = "strong" | "partial" | "missing";
export type RequirementType = "required" | "preferred" | "technology";

export interface RequirementMatch {
  requirementText: string;
  requirementType: RequirementType;
  status: MatchStatus;
  matchedSkillId: string | null;
  matchedExperienceId: string | null;
  matchedAccomplishmentId: string | null;
  matchedEvidenceId: string | null;
  rationale: string;
}

export interface DomainAssessment {
  status: MatchStatus;
  matchedExperienceIds: string[];
  rationale: string;
}

export interface JobMatchMapping {
  matches: RequirementMatch[];
  domainAssessment: DomainAssessment;
}

export interface MapJobRequirementsInput {
  job: { title: string | null; location: string | null };
  requirements: {
    required: string[];
    preferred: string[];
    technologies: string[];
  };
  careerProfile: {
    skills: { id: string; name: string; evidenceStrength: string }[];
    experiences: {
      id: string;
      company: string;
      title: string;
      technologies: string[];
      description: string | null;
    }[];
    accomplishments: { id: string; description: string }[];
    evidence: {
      id: string;
      title: string;
      problem: string;
      action: string;
      result: string;
    }[];
  };
}

export interface ExtractCareerProfileInput {
  rawText: string; // untrusted resume text — never treated as instructions
}

export interface ExtractedExperience {
  company: string;
  title: string;
  location: string | null;
  startDate: string | null; // best-effort YYYY-MM-DD; null if not determinable
  endDate: string | null; // null = current role or not determinable
  technologies: string[];
  description: string | null;
  accomplishments: string[];
}

export interface ExtractedProject {
  name: string;
  description: string | null;
  url: string | null;
  technologies: string[];
  startDate: string | null;
  endDate: string | null;
  accomplishments: string[];
}

export interface CareerProfileExtraction {
  experiences: ExtractedExperience[];
  projects: ExtractedProject[];
  skills: string[];
}

export type ResumeCitedType =
  | "experience"
  | "project"
  | "accomplishment"
  | "evidence"
  | "skill";

export interface ResumeClaim {
  text: string;
  citedType: ResumeCitedType;
  citedId: string;
}

export interface ResumeExperienceSection {
  experienceId: string;
  bullets: ResumeClaim[];
}

export interface ResumeProjectSection {
  projectId: string;
  bullets: ResumeClaim[];
}

export interface ResumeContentPlan {
  summaryClaims: ResumeClaim[];
  includedSkillIds: string[];
  experienceSections: ResumeExperienceSection[];
  projectSections: ResumeProjectSection[];
}

export interface GenerateResumeContentInput {
  // null job = Master Resume generation (no specific job to tailor toward)
  job: { title: string | null; company: string | null } | null;
  requirements: {
    required: string[];
    preferred: string[];
    technologies: string[];
  } | null;
  // Phase 3's already-computed trace, passed as read-only context to guide
  // emphasis/selection — never re-scored, never a substitute for this
  // call's own independent citation verification.
  matchContext: { requirementText: string; status: string; rationale: string }[] | null;
  careerProfile: {
    skills: { id: string; name: string; evidenceStrength: string }[];
    experiences: {
      id: string;
      company: string;
      title: string;
      technologies: string[];
      description: string | null;
    }[];
    projects: {
      id: string;
      name: string;
      description: string | null;
      technologies: string[];
    }[];
    accomplishments: {
      id: string;
      description: string;
      experienceId: string | null;
      projectId: string | null;
    }[];
    evidence: {
      id: string;
      title: string;
      problem: string;
      action: string;
      result: string;
    }[];
  };
}

export interface AIProvider {
  extractJobFields(input: JobExtractionInput): Promise<JobExtractionResult>;
  mapJobRequirements(input: MapJobRequirementsInput): Promise<JobMatchMapping>;
  extractCareerProfile(
    input: ExtractCareerProfileInput
  ): Promise<CareerProfileExtraction>;
  generateResumeContent(
    input: GenerateResumeContentInput
  ): Promise<ResumeContentPlan>;
}
