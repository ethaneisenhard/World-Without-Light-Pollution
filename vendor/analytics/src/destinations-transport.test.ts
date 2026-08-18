import { describe, expect, it, vi } from "vitest";
import { createDestinationsTransport } from "./destinations-transport.js";
import type { CanonicalEventPayload } from "./types.js";

const pageview: CanonicalEventPayload = {
  event_name: "pageview",
  properties: { visitor_id: "v1", site_id: "starter" },
};

describe("createDestinationsTransport", () => {
  it("fans out to first-party + webhook when env + events match", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 204 }));
    const transport = createDestinationsTransport({
      environment: "dev",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      destinations: [
        { provider: "first-party", enabledIn: ["dev"], events: "*" },
        {
          provider: "webhook",
          enabledIn: ["dev"],
          events: ["pageview"],
          config: { url: "https://hooks.example/ingest" },
        },
      ],
    });

    transport.track(pageview);
    await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(2));

    const calls = fetchImpl.mock.calls as unknown as Array<[unknown, RequestInit?]>;
    const urls = calls.map((c) => String(c[0]));
    expect(urls).toContain("/api/events");
    expect(urls).toContain("https://hooks.example/ingest");
  });

  it("skips destinations not enabled in environment", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 204 }));
    const transport = createDestinationsTransport({
      environment: "dev",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      destinations: [
        { provider: "first-party", enabledIn: ["production"], events: "*" },
      ],
    });
    transport.track(pageview);
    await new Promise((r) => setTimeout(r, 20));
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("respects event allow-list", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 204 }));
    const transport = createDestinationsTransport({
      environment: "dev",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      destinations: [
        { provider: "first-party", enabledIn: ["dev"], events: ["cta_clicked"] },
      ],
    });
    transport.track(pageview);
    await new Promise((r) => setTimeout(r, 20));
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("blocks analytics events when consent denies", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 204 }));
    const transport = createDestinationsTransport({
      environment: "dev",
      consentAllows: () => false,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      destinations: [{ provider: "first-party", events: "*" }],
    });
    transport.track(pageview);
    await new Promise((r) => setTimeout(r, 20));
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("posts GA4 measurement protocol when configured", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 204 }));
    const transport = createDestinationsTransport({
      environment: "production",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      destinations: [
        {
          provider: "ga4",
          enabledIn: ["production"],
          events: "*",
          config: { measurementId: "G-TEST", apiSecret: "secret" },
        },
      ],
    });
    transport.track(pageview);
    await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(1));
    const gaUrl = String((fetchImpl.mock.calls[0] as unknown as [unknown])[0]);
    expect(gaUrl).toContain("google-analytics.com/mp/collect");
  });

  it("posts PostHog capture when configured", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 204 }));
    const transport = createDestinationsTransport({
      environment: "dev",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      destinations: [
        {
          provider: "posthog",
          enabledIn: ["dev"],
          events: "*",
          config: { apiKey: "phc_test", host: "https://app.posthog.com" },
        },
      ],
    });
    transport.track(pageview);
    await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(1));
    const phUrl = String((fetchImpl.mock.calls[0] as unknown as [unknown])[0]);
    expect(phUrl).toBe("https://app.posthog.com/capture/");
  });
});
