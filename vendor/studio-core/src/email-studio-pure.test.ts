import { describe, expect, it } from "vitest";
import {
  campaignSendPath,
  parseEmailStudioTab,
  projectDeliverabilityChecklist,
} from "./email-studio-pure.js";

describe("email-studio-pure", () => {
  it("parses tabs with campaigns default", () => {
    expect(parseEmailStudioTab("audiences")).toBe("audiences");
    expect(parseEmailStudioTab("nope")).toBe("campaigns");
  });

  it("window tabs match Nav section order", async () => {
    const { EMAIL_STUDIO_TABS } = await import("./email-studio-pure.js");
    const { EMAIL_NAV_SECTIONS } = await import("./nav-studio-panels-pure.js");
    expect([...EMAIL_STUDIO_TABS]).toEqual(
      EMAIL_NAV_SECTIONS.map((s) => s.id),
    );
  });

  it("projects deliverability checklist", () => {
    const items = projectDeliverabilityChecklist({
      providerPlugin: "@glassbox-studio/email-cloudflare",
      domain: "northline.example",
      spf: true,
      dkim: false,
      dmarc: false,
      hasCloudflareCreds: true,
    });
    expect(items.find((i) => i.id === "spf")?.ok).toBe(true);
    expect(items.find((i) => i.id === "dkim")?.ok).toBe(false);
    expect(items.find((i) => i.id === "cf-creds")?.ok).toBe(true);
  });

  it("builds campaign send path", () => {
    expect(campaignSendPath("demo-marketing", "welcome")).toBe(
      "/api/projects/demo-marketing/email/campaigns/welcome/send",
    );
  });
});
