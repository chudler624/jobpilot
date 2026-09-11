import type { FieldCategory } from "./field-detection";
import type { CareerProfile } from "./career-profile";

export interface DetectedField {
  id: string;
  label: string;
  category: FieldCategory;
  technology: string | null;
  confidence: "high" | "medium" | "low";
}

// Content-script protocol — deliberately just these two actions. There is
// no "submit" action anywhere in this protocol; that's the actual
// enforcement mechanism behind "never submits anything" (see
// DECISIONS.md ADR-015), not a runtime check.
export type ContentRequest =
  | { type: "DETECT_FIELDS" }
  | { type: "FILL_FIELD"; fieldId: string; value: string };

export type ContentResponse =
  | { type: "FIELDS_DETECTED"; fields: DetectedField[] }
  | { type: "FILL_DONE" }
  | { type: "ERROR"; error: string };

// Popup <-> background protocol. The background worker is the single
// owner of the Supabase client/session — the popup never instantiates
// its own client, so there's exactly one place auth state lives.
export type BackgroundRequest =
  | { type: "GET_SESSION" }
  | { type: "REQUEST_CODE"; email: string }
  | { type: "VERIFY_CODE"; email: string; code: string }
  | { type: "SIGN_OUT" }
  | { type: "GET_CAREER_PROFILE" };

export type BackgroundResponse =
  | { type: "SESSION"; email: string | null }
  | { type: "OK" }
  | { type: "CAREER_PROFILE"; profile: CareerProfile }
  | { type: "ERROR"; error: string };
