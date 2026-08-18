import { describe, expect, it } from "vitest";
import { parseAnalyticsIntegration, parseConsentIntegration } from "./schemas.js";

describe("parseAnalyticsIntegration", () => {
  it("accepts destinations + funnels", () => {
    const r = parseAnalyticsIntegration({
      kind: "analytics",
      store: "primary-d1",
      destinations: [{ provider: "first-party", events: "*" }],
      funnels: [
        {
          id: "a",
          title: "A",
          steps: [
            { event: "pageview" },
            { event: "cta_clicked" },
          ],
        },
      ],
    });
    expect(r.ok).toBe(true);
  });

  it("rejects unknown provider", () => {
    const r = parseAnalyticsIntegration({
      kind: "analytics",
      destinations: [{ provider: "mixpanel" }],
    });
    expect(r.ok).toBe(false);
  });
});

describe("parseConsentIntegration", () => {
  it("requires all five categories", () => {
    const base = {
      kind: "consent",
      banner: {
        title: "t",
        description: "d",
        acceptAllLabel: "a",
        rejectNonEssentialLabel: "r",
        customizeLabel: "c",
        privacyPolicyUrl: "/p",
      },
      preferences: { linkLabel: "l", title: "t", saveLabel: "s" },
      categories: {
        strictly_necessary: { label: "a", description: "b" },
        functional: { label: "a", description: "b" },
        analytics: { label: "a", description: "b" },
        marketing: { label: "a", description: "b" },
        personalization: { label: "a", description: "b" },
      },
    };
    expect(parseConsentIntegration(base).ok).toBe(true);
    const bad = { ...base, categories: { ...base.categories } };
    delete (bad.categories as Record<string, unknown>).marketing;
    expect(parseConsentIntegration(bad).ok).toBe(false);
  });
});
