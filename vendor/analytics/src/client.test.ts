import { describe, expect, it, vi } from "vitest";
import { createAnalytics } from "./client.js";
import type { AnalyticsContext, CanonicalEventPayload, IdentifyTraits } from "./types.js";

const baseContext: AnalyticsContext = {
  siteId: "starter",
  environment: "dev",
  workspaceId: "production",
  visitorId: "v1",
  sessionId: "s1",
  consentAnalytics: true,
};

describe("createAnalytics", () => {
  it("track envelopes context onto properties", () => {
    const tracks: CanonicalEventPayload[] = [];
    const analytics = createAnalytics({
      context: baseContext,
      transport: {
        track(payload) {
          tracks.push(payload);
        },
      },
    });

    analytics.track("cta_clicked", { label: "Go" });

    expect(tracks).toHaveLength(1);
    expect(tracks[0]?.event_name).toBe("cta_clicked");
    expect(tracks[0]?.properties).toMatchObject({
      visitor_id: "v1",
      session_id: "s1",
      site_id: "starter",
      environment: "dev",
      workspace_id: "production",
      consent_analytics: true,
      label: "Go",
    });
  });

  it("page emits pageview with event_label", () => {
    const tracks: CanonicalEventPayload[] = [];
    const analytics = createAnalytics({
      context: baseContext,
      transport: {
        track(payload) {
          tracks.push(payload);
        },
      },
    });

    analytics.page({ custom: 1 });

    expect(tracks[0]?.event_name).toBe("pageview");
    expect(tracks[0]?.properties).toMatchObject({
      event_label: "Page viewed",
      custom: 1,
      page_route: "/",
    });
  });

  it("identify forwards to transport", () => {
    const identifies: Array<{ userId: string; traits?: IdentifyTraits }> = [];
    const analytics = createAnalytics({
      context: baseContext,
      transport: {
        track: vi.fn(),
        identify(userId, traits) {
          identifies.push({ userId, traits });
        },
      },
    });

    analytics.identify("u1", { email: "a@b.c" });
    expect(identifies).toEqual([{ userId: "u1", traits: { email: "a@b.c" } }]);
  });

  it("suppressed no-ops all calls", () => {
    const track = vi.fn();
    const identify = vi.fn();
    const analytics = createAnalytics({
      context: baseContext,
      transport: { track, identify },
      suppressed: true,
    });

    analytics.track("x");
    analytics.page();
    analytics.identify("u");
    expect(track).not.toHaveBeenCalled();
    expect(identify).not.toHaveBeenCalled();
  });
});
