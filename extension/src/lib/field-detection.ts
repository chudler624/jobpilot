export type FieldCategory =
  | "firstName"
  | "lastName"
  | "fullName"
  | "email"
  | "phone"
  | "workAuthorization"
  | "requiresSponsorship"
  | "yearsOfExperience"
  | "skillYesNo"
  | "unknown";

export interface Categorization {
  category: FieldCategory;
  /** Best-effort raw technology/skill hint pulled from the label text,
   *  for yearsOfExperience/skillYesNo — matched against the real Career
   *  Profile later, never trusted as-is. */
  technology: string | null;
  confidence: "high" | "medium" | "low";
}

interface Rule {
  category: FieldCategory;
  pattern: RegExp;
  confidence: "high" | "medium" | "low";
  extractTechnology?: (text: string) => string | null;
}

function extractAfter(pattern: RegExp) {
  return (text: string): string | null => {
    const match = text.match(pattern);
    return match?.[1]?.trim() || null;
  };
}

// Pure heuristic keyword matching — no AI, no network call. Ordered most
// specific first, since e.g. "years of experience with sponsorship" (an
// unlikely but possible label) should never win over a more specific rule
// listed later; first match wins.
const RULES: Rule[] = [
  { category: "email", pattern: /e-?mail/i, confidence: "high" },
  { category: "phone", pattern: /phone|mobile|cell\s*number/i, confidence: "high" },
  { category: "firstName", pattern: /first\s*name|given\s*name|fname\b/i, confidence: "high" },
  { category: "lastName", pattern: /last\s*name|surname|family\s*name|lname\b/i, confidence: "high" },
  { category: "fullName", pattern: /full\s*name|^name$|your\s*name/i, confidence: "medium" },
  {
    category: "requiresSponsorship",
    pattern: /sponsor(ship)?/i,
    confidence: "high",
  },
  {
    category: "workAuthorization",
    pattern: /work\s*authoriz|authoriz(ed|ation)\s*to\s*work|legally\s*(authorized|eligible)\s*to\s*work/i,
    confidence: "high",
  },
  {
    category: "yearsOfExperience",
    pattern: /years?\s*(of\s*)?experience/i,
    confidence: "medium",
    extractTechnology: extractAfter(/(?:experience\s*(?:with|in|using)\s+)([a-z0-9 .+#/-]{2,40})/i),
  },
  {
    category: "skillYesNo",
    pattern: /do you have\s*(any\s*)?experience\s*(with|in)|are you\s*(familiar|proficient|experienced)\s*(with|in)/i,
    confidence: "medium",
    extractTechnology: extractAfter(
      /(?:experience\s*(?:with|in)|familiar\s*(?:with|in)|proficient\s*(?:with|in)|experienced\s*(?:with|in))\s+([a-z0-9 .+#/-]{2,40})/i
    ),
  },
];

export function categorizeField(signalText: string): Categorization | null {
  const normalized = signalText.trim();
  if (!normalized) return null;

  for (const rule of RULES) {
    if (rule.pattern.test(normalized)) {
      return {
        category: rule.category,
        technology: rule.extractTechnology?.(normalized) ?? null,
        confidence: rule.confidence,
      };
    }
  }
  return null;
}
