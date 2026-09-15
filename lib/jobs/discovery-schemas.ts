import { z } from "zod";

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

// Adzuna natively supports all of these as real search parameters — a
// materially richer pre-fetch filter set than Greenhouse's list API can
// offer (see ADR-016). maxDaysOld isn't independently confirmed against
// Adzuna's own docs; omitted from the request rather than assumed if unset.
export const adzunaSearchSchema = z.object({
  what: optionalText,
  where: optionalText,
  whatExclude: optionalText,
  salaryMin: optionalInt,
  maxDaysOld: optionalInt,
});

// Separate from the standard ActionState — a fetch's outcome is normally
// informational ("5 new, 2 duplicates"), not an error, so it needs its own
// field rather than overloading `error` for non-error messages.
export type DiscoverState = { error?: string; summary?: string };
