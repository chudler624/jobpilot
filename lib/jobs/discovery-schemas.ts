import { z } from "zod";

const optionalText = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  });

export const watchedCompanySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  board_token: z
    .string()
    .trim()
    .min(1, "Greenhouse board token is required")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Board token can only contain letters, numbers, hyphens, and underscores"
    ),
});

// Pre-extraction filters, applied against the raw Greenhouse list before
// any job is inserted or spends an AI call — role/location match the
// title/location.name fields Greenhouse already returns; exclude is a
// simple title substring exclusion.
export const discoveryFiltersSchema = z.object({
  role: optionalText,
  location: optionalText,
  exclude: optionalText,
});

// Separate from the standard ActionState — a fetch's outcome is normally
// informational ("5 new, 2 duplicates"), not an error, so it needs its own
// field rather than overloading `error` for non-error messages.
export type DiscoverState = { error?: string; summary?: string };
