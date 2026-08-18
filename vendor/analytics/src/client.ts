import { collectPageviewProperties } from "./pageview.js";
import type {
  AnalyticsContext,
  AnalyticsTransport,
  CanonicalEventPayload,
  IdentifyTraits,
} from "./types.js";

export interface CreateAnalyticsOptions {
  context: AnalyticsContext;
  transport: AnalyticsTransport;
  /** Suppress all calls (CMS preview). */
  suppressed?: boolean;
  pageMeta?: { pageId?: string; pageType?: string; locale?: string };
}

export interface AnalyticsClient {
  track(eventName: string, properties?: Record<string, unknown>): void;
  page(extra?: Record<string, unknown>): void;
  identify(userId: string, traits?: IdentifyTraits): void;
}

export function createAnalytics(opts: CreateAnalyticsOptions): AnalyticsClient {
  const { context, transport, suppressed = false, pageMeta } = opts;

  function envelope(extra: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      visitor_id: context.visitorId,
      session_id: context.sessionId,
      user_id: context.userId ?? null,
      timestamp: Date.now(),
      site_id: context.siteId,
      environment: context.environment,
      workspace_id: context.workspaceId,
      locale: context.locale ?? null,
      consent_analytics: context.consentAnalytics ?? true,
      ...extra,
    };
  }

  return {
    track(eventName, properties = {}) {
      if (suppressed) return;
      const payload: CanonicalEventPayload = {
        event_name: eventName,
        properties: envelope(properties),
      };
      void transport.track(payload);
    },

    page(extra = {}) {
      if (suppressed) return;
      const pageProps = collectPageviewProperties(pageMeta);
      const payload: CanonicalEventPayload = {
        event_name: "pageview",
        properties: envelope({
          event_label: "Page viewed",
          ...pageProps,
          ...extra,
        }),
      };
      void transport.track(payload);
    },

    identify(userId, traits = {}) {
      if (suppressed) return;
      transport.identify?.(userId, traits);
    },
  };
}
