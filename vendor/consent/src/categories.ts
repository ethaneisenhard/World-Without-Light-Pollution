export const CONSENT_CATEGORIES = [
  "strictly_necessary",
  "functional",
  "analytics",
  "marketing",
  "personalization",
] as const;

export type ConsentCategory = (typeof CONSENT_CATEGORIES)[number];

export const OPTIONAL_CONSENT_CATEGORIES = CONSENT_CATEGORIES.filter(
  (c) => c !== "strictly_necessary",
) as readonly Exclude<ConsentCategory, "strictly_necessary">[];
