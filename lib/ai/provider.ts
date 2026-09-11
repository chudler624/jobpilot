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

export interface AIProvider {
  extractJobFields(input: JobExtractionInput): Promise<JobExtractionResult>;
  mapJobRequirements(input: MapJobRequirementsInput): Promise<JobMatchMapping>;
}
