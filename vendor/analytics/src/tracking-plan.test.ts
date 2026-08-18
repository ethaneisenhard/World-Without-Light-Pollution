import { describe, expect, it } from "vitest";
import { resolveFormAnalyticsIdentity, FORM_VISITOR_FIELD } from "./form-identity.js";
import { buildFormSubmittedEventProperties } from "./form-submitted.js";
import {
  PLATFORM_TRACKING_PLAN,
  buildTrackingPlanRows,
  formatTrackingPlanMarkdown,
  isDeprecatedEventName,
} from "./tracking-plan.js";
import { buildConsentTransparencyRows } from "./consent-transparency.js";
import { VISITOR_COOKIE_NAME } from "@glassbox-studio/identity";

describe("tracking-plan", () => {
  it("includes platform catalog", () => {
    expect(PLATFORM_TRACKING_PLAN.some((e) => e.name === "pageview")).toBe(true);
    const rows = buildTrackingPlanRows({
      button: [{ name: "signup_clicked", label: "Signup" }],
    });
    expect(rows.some((r) => r.declaredOn === "button")).toBe(true);
    expect(formatTrackingPlanMarkdown(rows)).toContain("pageview");
    expect(isDeprecatedEventName("hero_cta_clicked")).toBe(true);
  });
});

describe("form-identity", () => {
  it("prefers cookie over stitch", () => {
    const id = resolveFormAnalyticsIdentity({
      cookieHeader: `${VISITOR_COOKIE_NAME}=cookie-v; other=1`,
      stitch: { visitorId: "stitch-v", sessionId: "stitch-s" },
    });
    expect(id.visitorId).toBe("cookie-v");
    expect(FORM_VISITOR_FIELD).toBe("__as_visitor_id");
  });
});

describe("form-submitted", () => {
  it("skips test submissions", () => {
    expect(
      buildFormSubmittedEventProperties({
        destinationName: "contact",
        payload: { email: "a@b.c" },
        test: true,
      }),
    ).toBeNull();
  });
});

describe("consent-transparency", () => {
  it("merges scripts + events", () => {
    const rows = buildConsentTransparencyRows({
      scripts: [{ id: "ga", label: "GA", consent: "analytics" }],
      componentEvents: {},
    });
    expect(rows.some((r) => r.kind === "script" && r.id === "ga")).toBe(true);
    expect(rows.some((r) => r.kind === "event" && r.id === "pageview")).toBe(true);
  });
});
