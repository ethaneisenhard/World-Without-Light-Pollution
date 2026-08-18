import {
  createAnalytics,
  createDestinationsTransport,
  parseAnalyticsIntegration,
  parseConsentIntegration,
  type AnalyticsDestination,
  type AnalyticsTransport,
  type ConsentIntegrationDoc,
} from "@glassbox-studio/analytics";
import {
  createConsentApi,
  type ConsentApi,
  type ConsentStorage,
} from "@glassbox-studio/consent";
import { mintSessionId, mintVisitorId } from "@glassbox-studio/identity";

export interface BootAnalyticsInput {
  siteId: string;
  policyVersion?: string;
  analyticsJson: unknown;
  consentJson: unknown;
  environment?: "dev" | "staging" | "production";
  storage?: ConsentStorage;
  fetchImpl?: typeof fetch;
  /** When true, skip mounting and only prepare clients (tests). */
  suppressed?: boolean;
  visitorId?: string;
  sessionId?: string;
}

export interface BootAnalyticsResult {
  consent: ConsentApi;
  analytics: ReturnType<typeof createAnalytics> | null;
  transport: AnalyticsTransport | null;
  destinations: AnalyticsDestination[];
  banner: ConsentIntegrationDoc["banner"];
  categories: ConsentIntegrationDoc["categories"];
  preferences: ConsentIntegrationDoc["preferences"];
  shouldShowBanner: boolean;
  /** Call after accept/reject to fire pageview when analytics granted. */
  maybePage: () => void;
}

/**
 * Pure-ish boot: parse integrations, build consent + destinations transport.
 * Hosts call `mountPrivacyPrompt` when `shouldShowBanner` / always for Live.
 */
export function bootAnalyticsConsent(input: BootAnalyticsInput): BootAnalyticsResult {
  const analyticsParsed = parseAnalyticsIntegration(input.analyticsJson);
  const consentParsed = parseConsentIntegration(input.consentJson);
  if (!consentParsed.ok) {
    throw new Error(`invalid consent.json: ${consentParsed.error}`);
  }
  if (!analyticsParsed.ok) {
    throw new Error(`invalid analytics.json: ${analyticsParsed.error}`);
  }

  const consent = createConsentApi({
    siteId: input.siteId,
    policyVersion: consentParsed.value.policyVersion ?? input.policyVersion ?? "1",
    storage: input.storage,
  });

  const destinations = analyticsParsed.value.destinations as AnalyticsDestination[];
  const environment = input.environment ?? "dev";

  const transport = createDestinationsTransport({
    destinations,
    environment,
    consentAllows: (cat) => (cat === "analytics" ? consent.has("analytics") : true),
    fetchImpl: input.fetchImpl,
  });

  const analytics = createAnalytics({
    context: {
      siteId: input.siteId,
      environment,
      workspaceId: "production",
      visitorId: input.visitorId ?? mintVisitorId(),
      sessionId: input.sessionId ?? mintSessionId(),
      consentAnalytics: consent.has("analytics"),
    },
    transport,
    suppressed: input.suppressed ?? false,
  });

  return {
    consent,
    analytics,
    transport,
    destinations,
    banner: consentParsed.value.banner,
    categories: consentParsed.value.categories,
    preferences: consentParsed.value.preferences,
    shouldShowBanner: !consent.hasStoredConsent(),
    maybePage: () => {
      if (consent.has("analytics")) analytics.page();
    },
  };
}
