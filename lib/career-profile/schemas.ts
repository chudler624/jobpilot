import { z } from "zod";

const optionalText = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  });

const optionalDate = z
  .string()
  .optional()
  .transform((value) => (value ? value : null));

const technologies = z
  .string()
  .optional()
  .transform((value) =>
    (value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  );

export const experienceSchema = z
  .object({
    company: z.string().trim().min(1, "Company is required"),
    title: z.string().trim().min(1, "Title is required"),
    location: optionalText,
    start_date: z.string().min(1, "Start date is required"),
    end_date: optionalDate,
    description: optionalText,
    technologies,
  })
  .refine(
    (data) => !data.end_date || data.end_date >= data.start_date,
    { message: "End date can't be before start date", path: ["end_date"] }
  );

export const projectSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    description: optionalText,
    url: z
      .string()
      .optional()
      .transform((value) => (value ? value : null))
      .refine(
        (value) => !value || z.url().safeParse(value).success,
        "Must be a valid URL"
      ),
    technologies,
    start_date: optionalDate,
    end_date: optionalDate,
  })
  .refine(
    (data) =>
      !data.end_date || !data.start_date || data.end_date >= data.start_date,
    { message: "End date can't be before start date", path: ["end_date"] }
  );

export const evidenceSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  problem: z.string().trim().min(1, "Problem is required"),
  action: z.string().trim().min(1, "Action is required"),
  result: z.string().trim().min(1, "Result is required"),
  verified: z
    .string()
    .optional()
    .transform((value) => value === "on"),
});

export const skillSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    evidence_strength: z.enum(["direct", "adjacent", "limited", "none"]),
    evidence_id: z
      .string()
      .optional()
      .transform((value) => (value ? value : null)),
    notes: optionalText,
  })
  .refine(
    (data) => data.evidence_strength !== "direct" || data.evidence_id !== null,
    {
      message: "Direct evidence-strength requires a linked evidence entry",
      path: ["evidence_id"],
    }
  );

export const accomplishmentSchema = z.object({
  description: z.string().trim().min(1, "Description is required"),
  evidence_id: z
    .string()
    .optional()
    .transform((value) => (value ? value : null)),
});

export function parseFormData<T extends z.ZodType>(
  schema: T,
  formData: FormData
) {
  return schema.safeParse(Object.fromEntries(formData));
}

export type ActionState = { error?: string };
