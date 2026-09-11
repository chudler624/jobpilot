import { z } from "zod";
import type { ApplicationStatus } from "@/types/supabase";

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  discovered: "Discovered",
  qualified: "Qualified",
  resume_generated: "Resume Generated",
  ready: "Ready",
  applied: "Applied",
  recruiter_screen: "Recruiter Screen",
  interview: "Interview",
  final: "Final",
  offer: "Offer",
  rejected: "Rejected",
  ghosted: "Ghosted",
} as const;

// Display/grouping order for the pipeline — transitions are not restricted
// to this order (a real job search skips or jumps stages), this is purely
// for rendering the list grouped in a sensible sequence.
export const STATUS_ORDER: ApplicationStatus[] = [
  "discovered",
  "qualified",
  "resume_generated",
  "ready",
  "applied",
  "recruiter_screen",
  "interview",
  "final",
  "offer",
  "rejected",
  "ghosted",
];

// Statuses that count as "applied or further along" for dashboard counts.
export const APPLIED_OR_LATER: ApplicationStatus[] = [
  "applied",
  "recruiter_screen",
  "interview",
  "final",
  "offer",
  "rejected",
  "ghosted",
];

const optionalText = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  });

const tags = z
  .string()
  .optional()
  .transform((value) =>
    (value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  );

export const applicationEditSchema = z.object({
  resume_version_id: z
    .string()
    .optional()
    .transform((value) => (value ? value : null)),
  salary_notes: optionalText,
  cover_letter_text: optionalText,
  why_tags: tags,
});

export const statusChangeSchema = z.object({
  status: z.enum([
    "discovered",
    "qualified",
    "resume_generated",
    "ready",
    "applied",
    "recruiter_screen",
    "interview",
    "final",
    "offer",
    "rejected",
    "ghosted",
  ]),
  note: optionalText,
});

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  role: optionalText,
  email: optionalText,
  phone: optionalText,
  linkedin_url: optionalText,
  notes: optionalText,
});

export const interviewSchema = z.object({
  interview_type: optionalText,
  scheduled_at: z
    .string()
    .optional()
    .transform((value) => (value ? new Date(value).toISOString() : null)),
  contact_id: z
    .string()
    .optional()
    .transform((value) => (value ? value : null)),
  notes: optionalText,
  outcome: optionalText,
});

export const followUpSchema = z.object({
  note: z.string().trim().min(1, "Note is required"),
  due_date: z
    .string()
    .optional()
    .transform((value) => (value ? value : null)),
});
