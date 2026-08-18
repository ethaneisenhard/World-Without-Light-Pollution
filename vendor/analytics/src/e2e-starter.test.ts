import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { createMemoryAnalyticsStore } from "@glassbox-studio/studio-analytics";
import {
  createAnalytics,
  createDestinationsTransport,
  parseAnalyticsIntegration,
  parseConsentIntegration,
} from "./index.js";
import { createConsentApi } from "@glassbox-studio/consent";

const starterRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../projects/glassbox-studio-template",
);

describe("analytics-consent e2e (starter fixtures)", () => {
  const analyticsJson = JSON.parse(
    readFileSync(join(starterRoot, "integrations/analytics.json"), "utf8"),
  );
  const consentJson = JSON.parse(
    readFileSync(join(starterRoot, "integrations/consent.json"), "utf8"),
  );

  it("parses starter integrations", () => {
    expect(parseAnalyticsIntegration(analyticsJson).ok).toBe(true);
    expect(parseConsentIntegration(consentJson).ok).toBe(true);
  });

  it("consent deny → no store; accept → pageview stored", async () => {
    const store = createMemoryAnalyticsStore();
    const consent = createConsentApi({ siteId: "oracle", policyVersion: "1" });
    const transport = createDestinationsTransport({
      environment: "dev",
      destinations: [{ provider: "first-party", events: "*" }],
      consentAllows: () => consent.has("analytics"),
      fetchImpl: async (_url, init) => {
        const body = JSON.parse(String(init?.body ?? "{}")) as {
          event_name?: string;
          properties?: Record<string, unknown>;
        };
        await store.track({
          name: body.event_name ?? "unknown",
          props: body.properties ?? {},
        });
        return new Response(null, { status: 204 });
      },
    });
    const analytics = createAnalytics({
      context: {
        siteId: "oracle",
        environment: "dev",
        workspaceId: "production",
        visitorId: "v",
        sessionId: "s",
      },
      transport,
    });

    analytics.page();
    await new Promise((r) => setTimeout(r, 30));
    expect(await store.list({ limit: 10 })).toHaveLength(0);

    consent.acceptAll();
    analytics.page();
    await vi.waitFor(async () => {
      expect((await store.list({ limit: 10 })).some((e) => e.name === "pageview")).toBe(
        true,
      );
    });
  });
});
