export type AnalyticsEnvironment = "dev" | "staging" | "production";

export const ANALYTICS_ENVIRONMENTS = ["dev", "staging", "production"] as const;

export interface AnalyticsContext {
  siteId: string;
  environment: AnalyticsEnvironment;
  workspaceId: string;
  visitorId: string;
  sessionId: string;
  userId?: string | null;
  locale?: string;
  consentAnalytics?: boolean;
}

export interface CanonicalEventPayload {
  event_name: string;
  properties?: Record<string, unknown>;
}

export interface IdentifyTraits {
  email?: string;
  name?: string;
  [key: string]: unknown;
}

export interface AnalyticsTransport {
  track(event: CanonicalEventPayload): void | Promise<void>;
  identify?(userId: string, traits?: IdentifyTraits): void | Promise<void>;
}
