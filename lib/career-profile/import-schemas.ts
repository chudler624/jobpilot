import { z } from "zod";

export const extractedExperienceSchema = z.object({
  company: z.string().trim().min(1),
  title: z.string().trim().min(1),
  location: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  technologies: z.array(z.string()),
  description: z.string().nullable(),
  accomplishments: z.array(z.string()),
});

export const extractedProjectSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().nullable(),
  url: z.string().nullable(),
  technologies: z.array(z.string()),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  accomplishments: z.array(z.string()),
});

export const careerProfileExtractionSchema = z.object({
  experiences: z.array(extractedExperienceSchema),
  projects: z.array(extractedProjectSchema),
  skills: z.array(z.string()),
});

// Stricter than the raw extraction: by the time the user commits, every
// included experience must have a start date (the DB column is NOT NULL) —
// the AI may not have found one, in which case the review UI requires the
// user to fill it in before this validates.
export const commitExperienceSchema = extractedExperienceSchema.extend({
  startDate: z.string().trim().min(1, "Start date is required"),
});

export const commitImportSchema = z.object({
  experiences: z.array(commitExperienceSchema),
  projects: z.array(extractedProjectSchema),
  skills: z.array(z.string().trim().min(1)),
});

export type CommitImportPayload = z.infer<typeof commitImportSchema>;
