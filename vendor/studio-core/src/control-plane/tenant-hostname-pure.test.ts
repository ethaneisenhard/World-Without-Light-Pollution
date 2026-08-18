import { describe, expect, it } from "vitest";
import {
  parseNestedPlatformServiceSlug,
  parsePlatformStudioSlug,
  platformStudioHostname,
  platformStudioUrl,
  resolveStudioPublicUrl,
} from "./tenant-hostname-pure.js";

describe("tenant-hostname-pure", () => {
  it("builds platform subdomain on browserui.site", () => {
    expect(platformStudioHostname("eeisen11")).toBe("eeisen11.browserui.site");
    expect(platformStudioUrl("eeisen11")).toBe(
      "https://eeisen11.browserui.site",
    );
  });

  it("parses platform host → slug", () => {
    expect(parsePlatformStudioSlug("eeisen11.browserui.site")).toBe("eeisen11");
    expect(parsePlatformStudioSlug("EEISEN11.browserui.site:443")).toBe(
      "eeisen11",
    );
    expect(parsePlatformStudioSlug("browserui.site")).toBeNull();
    expect(parsePlatformStudioSlug("www.browserui.site")).toBeNull();
    expect(parsePlatformStudioSlug("a.b.browserui.site")).toBeNull();
    expect(parsePlatformStudioSlug("bu-user6cde-studio.devbyethan.workers.dev")).toBeNull();
    expect(
      parseNestedPlatformServiceSlug(
        "gateway.acme.glassboxcomputer.site",
        "gateway",
        "glassboxcomputer.site",
      ),
    ).toBe("acme");
    expect(
      parseNestedPlatformServiceSlug(
        "gateway.glassboxcomputer.site",
        "gateway",
        "glassboxcomputer.site",
      ),
    ).toBeNull();
  });

  it("prefers attached URL (future custom DNS) over platform default", () => {
    expect(
      resolveStudioPublicUrl({
        tenantSlug: "eeisen11",
        attachedWorkerUrl: "https://studio.acme.com",
      }),
    ).toBe("https://studio.acme.com");
    expect(
      resolveStudioPublicUrl({ tenantSlug: "eeisen11", attachedWorkerUrl: null }),
    ).toBe("https://eeisen11.browserui.site");
  });
});
