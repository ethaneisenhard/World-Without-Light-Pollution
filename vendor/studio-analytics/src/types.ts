/**
 * AnalyticsStore — first-party CDP event store before fan-out destinations.
 * Ideal: D1 / Analytics Engine. Third parties (GA4, Plausible) = destinations only.
 */

export type AnalyticsEvent = {
  id: string;
  name: string;
  props: Record<string, unknown>;
  createdAt: number;
};

export type AnalyticsTrackInput = {
  name: string;
  props?: Record<string, unknown>;
  id?: string;
};

/** Destination fan-out stub — real adapters later. */
export type AnalyticsDestination = {
  id: string;
  send: (event: AnalyticsEvent) => Promise<void>;
};

export type AnalyticsStore = {
  track: (input: AnalyticsTrackInput) => Promise<AnalyticsEvent>;
  list: (opts?: { limit?: number }) => Promise<AnalyticsEvent[]>;
};

export function createAnalyticsEventId(now = Date.now()): string {
  return `evt_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
