import type { AnalyticsEnvironment } from "./types.js";

export type AnalyticsDestinationProvider =
  | "first-party"
  | "posthog"
  | "ga4"
  | "segment"
  | "plausible"
  | "umami"
  | "webhook";

export interface AnalyticsDestination {
  provider: AnalyticsDestinationProvider;
  enabledIn?: AnalyticsEnvironment[];
  /** `"*"` or allow-list of event names. */
  events?: "*" | string[];
  config?: Record<string, unknown>;
}

export type ConsentCategory =
  | "strictly_necessary"
  | "functional"
  | "analytics"
  | "marketing"
  | "personalization";
