import type { AnalyticsDestination } from "./destination-types.js";
import type {
  AnalyticsEnvironment,
  AnalyticsTransport,
  CanonicalEventPayload,
  IdentifyTraits,
} from "./types.js";

export interface CreateDestinationsTransportOptions {
  destinations: AnalyticsDestination[];
  environment: AnalyticsEnvironment;
  /** Return true when the given consent category is granted. Default: allow analytics. */
  consentAllows?: (category: "analytics") => boolean;
  fetchImpl?: typeof fetch;
  /** Override path for first-party ingest (default `/api/events`). */
  firstPartyPath?: string;
  /** Called for stub providers (segment/plausible/umami) — tests may assert. */
  onStubSend?: (provider: string, payload: CanonicalEventPayload) => void;
}

function eventAllowed(dest: AnalyticsDestination, eventName: string): boolean {
  const events = dest.events ?? "*";
  if (events === "*") return true;
  return events.includes(eventName);
}

function enabledHere(dest: AnalyticsDestination, environment: AnalyticsEnvironment): boolean {
  const envs = dest.enabledIn ?? ["dev", "staging", "production"];
  return envs.includes(environment);
}

async function postJson(
  fetchImpl: typeof fetch,
  url: string,
  body: unknown,
  headers: Record<string, string> = {},
): Promise<void> {
  await fetchImpl(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
    credentials: "same-origin",
  });
}

function resolveFirstPartyUrl(config: Record<string, unknown> | undefined, path: string): string {
  const base = typeof config?.apiBase === "string" ? config.apiBase.replace(/\/$/, "") : "";
  const customPath = typeof config?.path === "string" ? config.path : path;
  return `${base}${customPath.startsWith("/") ? customPath : `/${customPath}`}`;
}

export function createDestinationsTransport(
  opts: CreateDestinationsTransportOptions,
): AnalyticsTransport {
  const {
    destinations,
    environment,
    consentAllows = () => true,
    fetchImpl = fetch,
    firstPartyPath = "/api/events",
    onStubSend,
  } = opts;

  async function sendToDestination(
    dest: AnalyticsDestination,
    payload: CanonicalEventPayload,
  ): Promise<void> {
    const config = dest.config ?? {};

    switch (dest.provider) {
      case "first-party": {
        const url = resolveFirstPartyUrl(config, firstPartyPath);
        await postJson(fetchImpl, url, payload);
        return;
      }
      case "webhook": {
        const url = typeof config.url === "string" ? config.url : "";
        if (!url) return;
        await postJson(fetchImpl, url, payload);
        return;
      }
      case "ga4": {
        // Measurement Protocol (GA4) — requires measurementId + apiSecret in config.
        const measurementId = typeof config.measurementId === "string" ? config.measurementId : "";
        const apiSecret = typeof config.apiSecret === "string" ? config.apiSecret : "";
        const clientId =
          typeof payload.properties?.visitor_id === "string"
            ? payload.properties.visitor_id
            : "anonymous";
        if (!measurementId || !apiSecret) return;
        const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;
        await postJson(fetchImpl, url, {
          client_id: clientId,
          events: [
            {
              name: payload.event_name.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 40),
              params: payload.properties ?? {},
            },
          ],
        });
        return;
      }
      case "posthog": {
        const apiKey = typeof config.apiKey === "string" ? config.apiKey : "";
        const host =
          typeof config.host === "string" ? config.host.replace(/\/$/, "") : "https://us.i.posthog.com";
        if (!apiKey) return;
        const distinctId =
          typeof payload.properties?.visitor_id === "string"
            ? payload.properties.visitor_id
            : "anonymous";
        await postJson(fetchImpl, `${host}/capture/`, {
          api_key: apiKey,
          event: payload.event_name,
          properties: {
            distinct_id: distinctId,
            ...(payload.properties ?? {}),
          },
        });
        return;
      }
      case "segment":
      case "plausible":
      case "umami": {
        onStubSend?.(dest.provider, payload);
        return;
      }
      default:
        return;
    }
  }

  return {
    track(payload) {
      if (!consentAllows("analytics") && payload.event_name !== "consent_updated") {
        return;
      }
      const jobs: Promise<void>[] = [];
      for (const dest of destinations) {
        if (!enabledHere(dest, environment)) continue;
        if (!eventAllowed(dest, payload.event_name)) continue;
        jobs.push(sendToDestination(dest, payload));
      }
      void Promise.allSettled(jobs);
    },

    identify(userId, traits?: IdentifyTraits) {
      if (!consentAllows("analytics")) return;
      // Identify as a first-class event for destinations that only speak track.
      const payload: CanonicalEventPayload = {
        event_name: "identify",
        properties: { user_id: userId, ...(traits ?? {}) },
      };
      this.track(payload);
    },
  };
}
