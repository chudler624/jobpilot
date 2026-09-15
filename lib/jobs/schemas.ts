import { z } from "zod";

export const jobIntakeSchema = z
  .object({
    url: z
      .string()
      .optional()
      .transform((value) => {
        const trimmed = value?.trim();
        return trimmed ? trimmed : undefined;
      }),
    rawText: z
      .string()
      .optional()
      .transform((value) => {
        const trimmed = value?.trim();
        return trimmed ? trimmed : undefined;
      }),
  })
  .refine((data) => (data.url ? 1 : 0) + (data.rawText ? 1 : 0) === 1, {
    message: "Paste a URL or the job description text, not both",
    path: ["rawText"],
  });

export const jobDescriptionReplaceSchema = z.object({
  rawText: z
    .string()
    .trim()
    .min(200, "That's too short to be the full posting — paste the whole description.")
    .max(50000, "That's longer than any real job posting — paste just the description."),
});

export const jobExtractionResultSchema = z.object({
  company: z.string().nullable(),
  title: z.string().nullable(),
  location: z.string().nullable(),
  workplaceType: z.enum(["remote", "hybrid", "onsite"]).nullable(),
  salaryMin: z.number().int().nullable(),
  salaryMax: z.number().int().nullable(),
  salaryCurrency: z.string().nullable(),
  responsibilities: z.array(z.string()),
  requiredQualifications: z.array(z.string()),
  preferredQualifications: z.array(z.string()),
  technologies: z.array(z.string()),
  experienceRequirement: z.string().nullable(),
  educationRequirement: z.string().nullable(),
  keywords: z.array(z.string()),
});

const optionalText = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  });

const optionalInt = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim();
    if (!trimmed) return null;
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isNaN(parsed) ? null : parsed;
  });

export const jobEditSchema = z
  .object({
    company: optionalText,
    title: optionalText,
    location: optionalText,
    workplace_type: z
      .string()
      .optional()
      .transform((value) =>
        value === "remote" || value === "hybrid" || value === "onsite"
          ? value
          : null
      ),
    salary_min: optionalInt,
    salary_max: optionalInt,
    salary_currency: optionalText,
  })
  .refine(
    (data) =>
      data.salary_min === null ||
      data.salary_max === null ||
      data.salary_max >= data.salary_min,
    { message: "Max salary can't be less than min salary", path: ["salary_max"] }
  );
