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

export interface AIProvider {
  extractJobFields(input: JobExtractionInput): Promise<JobExtractionResult>;
}
