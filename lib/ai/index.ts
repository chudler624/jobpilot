import { GeminiProvider } from "./gemini-provider";
import type { AIProvider } from "./provider";

export function getAIProvider(): AIProvider {
  return new GeminiProvider();
}

export type {
  AIProvider,
  JobExtractionInput,
  JobExtractionResult,
  MapJobRequirementsInput,
  JobMatchMapping,
  RequirementMatch,
  DomainAssessment,
  MatchStatus,
  RequirementType,
  ExtractCareerProfileInput,
  CareerProfileExtraction,
  ExtractedExperience,
  ExtractedProject,
} from "./provider";
