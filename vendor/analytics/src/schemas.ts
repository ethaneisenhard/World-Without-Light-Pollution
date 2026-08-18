import type { AnalyticsDestinationProvider } from "./destination-types.js";
import type { AnalyticsEnvironment } from "./types.js";

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

export interface AnalyticsIntegrationDoc {
  id?: string;
  kind: "analytics";
  store?: string;
  destinations: Array<{
    provider: AnalyticsDestinationProvider;
    enabledIn?: AnalyticsEnvironment[];
    events?: "*" | string[];
    config?: Record<string, unknown>;
  }>;
  funnels?: Array<{
    id: string;
    title: string;
    windowDays?: number;
    steps: Array<{ event: string; label?: string }>;
  }>;
}

const PROVIDERS = new Set<string>([
  "first-party",
  "posthog",
  "ga4",
  "segment",
  "plausible",
  "umami",
  "webhook",
]);

export function parseAnalyticsIntegration(input: unknown): ParseResult<AnalyticsIntegrationDoc> {
  if (!input || typeof input !== "object") return { ok: false, error: "expected object" };
  const doc = input as Record<string, unknown>;
  if (doc.kind !== "analytics") return { ok: false, error: 'kind must be "analytics"' };
  const destinations = Array.isArray(doc.destinations) ? doc.destinations : [];
  for (const d of destinations) {
    if (!d || typeof d !== "object") return { ok: false, error: "invalid destination" };
    const provider = (d as { provider?: string }).provider;
    if (!provider || !PROVIDERS.has(provider)) {
      return { ok: false, error: `unknown destination provider: ${String(provider)}` };
    }
  }
  return {
    ok: true,
    value: {
      id: typeof doc.id === "string" ? doc.id : undefined,
      kind: "analytics",
      store: typeof doc.store === "string" ? doc.store : undefined,
      destinations: destinations as AnalyticsIntegrationDoc["destinations"],
      funnels: Array.isArray(doc.funnels)
        ? (doc.funnels as AnalyticsIntegrationDoc["funnels"])
        : undefined,
    },
  };
}

export interface ConsentIntegrationDoc {
  id?: string;
  kind: "consent";
  label?: string;
  provider?: string;
  policyVersion?: string;
  banner: {
    title: string;
    description: string;
    acceptAllLabel: string;
    rejectNonEssentialLabel: string;
    customizeLabel: string;
    privacyPolicyUrl: string;
  };
  categories: Record<
    string,
    {
      label: string;
      description: string;
    }
  >;
  preferences: {
    linkLabel: string;
    title: string;
    saveLabel: string;
    closeLabel?: string;
  };
  transparency?: Record<string, unknown>;
}

const REQUIRED_CATS = [
  "strictly_necessary",
  "functional",
  "analytics",
  "marketing",
  "personalization",
] as const;

export function parseConsentIntegration(input: unknown): ParseResult<ConsentIntegrationDoc> {
  if (!input || typeof input !== "object") return { ok: false, error: "expected object" };
  const doc = input as Record<string, unknown>;
  if (doc.kind !== "consent") return { ok: false, error: 'kind must be "consent"' };
  const banner = doc.banner as ConsentIntegrationDoc["banner"] | undefined;
  if (!banner?.title || !banner.description) {
    return { ok: false, error: "banner.title and banner.description required" };
  }
  const categories = doc.categories as ConsentIntegrationDoc["categories"] | undefined;
  if (!categories) return { ok: false, error: "categories required" };
  for (const cat of REQUIRED_CATS) {
    if (!categories[cat]?.label || !categories[cat]?.description) {
      return { ok: false, error: `categories.${cat} label+description required` };
    }
  }
  const preferences = doc.preferences as ConsentIntegrationDoc["preferences"] | undefined;
  if (!preferences?.linkLabel || !preferences.title || !preferences.saveLabel) {
    return { ok: false, error: "preferences linkLabel/title/saveLabel required" };
  }
  return {
    ok: true,
    value: {
      id: typeof doc.id === "string" ? doc.id : undefined,
      kind: "consent",
      label: typeof doc.label === "string" ? doc.label : undefined,
      provider: typeof doc.provider === "string" ? doc.provider : undefined,
      policyVersion: typeof doc.policyVersion === "string" ? doc.policyVersion : "1",
      banner: {
        title: banner.title,
        description: banner.description,
        acceptAllLabel: banner.acceptAllLabel ?? "Accept all",
        rejectNonEssentialLabel: banner.rejectNonEssentialLabel ?? "Reject non-essential",
        customizeLabel: banner.customizeLabel ?? "Customize",
        privacyPolicyUrl: banner.privacyPolicyUrl ?? "/privacy",
      },
      categories,
      preferences: {
        ...preferences,
        closeLabel: preferences.closeLabel ?? "Close",
      },
      transparency:
        doc.transparency && typeof doc.transparency === "object"
          ? (doc.transparency as Record<string, unknown>)
          : undefined,
    },
  };
}
