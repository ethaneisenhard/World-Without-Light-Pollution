import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { bootAnalyticsConsent } from "./boot-pure.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const analyticsJson = JSON.parse(
  readFileSync(join(root, "integrations/analytics.json"), "utf8"),
);
const consentJson = JSON.parse(
  readFileSync(join(root, "integrations/consent.json"), "utf8"),
);

describe("bootAnalyticsConsent", () => {
  it("does not pageview without analytics consent", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 204 }));
    const store = new Map<string, string>();
    const boot = bootAnalyticsConsent({
      siteId: "glassbox-studio-template",
      analyticsJson,
      consentJson,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      storage: {
        getItem: (k) => (store.has(k) ? store.get(k)! : null),
        setItem: (k, v) => {
          store.set(k, v);
        },
      },
      visitorId: "v-test",
      sessionId: "s-test",
    });

    boot.maybePage();
    await new Promise((r) => setTimeout(r, 20));
    expect(fetchImpl).not.toHaveBeenCalled();

    boot.consent.acceptAll();
    boot.maybePage();
    await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalled());
    expect(String((fetchImpl.mock.calls[0] as unknown as [unknown])[0])).toContain(
      "/api/events",
    );
  });

  it("Accept persists across reboot (Live iframe soft-reload)", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
    };
    const first = bootAnalyticsConsent({
      siteId: "glassbox-studio-template",
      analyticsJson,
      consentJson,
      storage,
      visitorId: "v1",
      sessionId: "s1",
    });
    expect(first.shouldShowBanner).toBe(true);
    first.consent.acceptAll();

    const second = bootAnalyticsConsent({
      siteId: "glassbox-studio-template",
      analyticsJson,
      consentJson,
      storage,
      visitorId: "v1",
      sessionId: "s1",
    });
    expect(second.shouldShowBanner).toBe(false);
    expect(second.consent.has("analytics")).toBe(true);
  });
});
