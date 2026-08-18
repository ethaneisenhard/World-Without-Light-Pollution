import { describe, expect, it } from "vitest";
import { PLATFORM_STUDIO_PRIMARY_SLUG } from "./reserved-tenant-slugs-pure.js";
import {
  DEFAULT_API_SITE_BASE_DOMAIN,
  hostPublicUrlEnvFromResourceUrl,
  parsePlatformApiSlug,
  PLATFORM_PRIMARY_API_URL,
  platformApiDnsRecordName,
  platformApiHostname,
  platformApiUrl,
  platformApiUrlFromStudioHostname,
} from "./api-hostname-pure.js";

describe("api-hostname-pure", () => {
  it("builds nested api.{slug}.glassboxcomputer.site", () => {
    expect(platformApiHostname("acme")).toBe(
      "api.acme.glassboxcomputer.site",
    );
    expect(platformApiUrl("acme")).toBe(
      "https://api.acme.glassboxcomputer.site",
    );
    expect(DEFAULT_API_SITE_BASE_DOMAIN).toBe("glassboxcomputer.site");
  });

  it("primary auth shell → api.auth.…site", () => {
    expect(PLATFORM_STUDIO_PRIMARY_SLUG).toBe("auth");
    expect(platformApiUrl("auth")).toBe(
      "https://api.auth.glassboxcomputer.site",
    );
    expect(PLATFORM_PRIMARY_API_URL).toBe(
      "https://api.auth.glassboxcomputer.site",
    );
    expect(
      platformApiUrlFromStudioHostname("auth.glassboxcomputer.site"),
    ).toBe("https://api.auth.glassboxcomputer.site");
    expect(
      platformApiUrlFromStudioHostname("acme.glassboxcomputer.site"),
    ).toBe("https://api.acme.glassboxcomputer.site");
    expect(
      platformApiUrlFromStudioHostname("api.glassboxcomputer.site"),
    ).toBeNull();
    expect(
      platformApiUrlFromStudioHostname("workflows.glassboxcomputer.site"),
    ).toBeNull();
  });

  it("rejects empty / invalid slug", () => {
    expect(platformApiHostname("")).toBeNull();
    expect(platformApiHostname("!!!")).toBeNull();
    expect(platformApiUrl("")).toBeNull();
    expect(platformApiDnsRecordName("")).toBeNull();
    expect(platformApiUrlFromStudioHostname("glassboxcomputer.site")).toBeNull();
  });

  it("normalizes base domain and builds DNS record name", () => {
    expect(
      platformApiHostname("Acme-Co", "https://Glassboxcomputer.site/"),
    ).toBe("api.acme-co.glassboxcomputer.site");
    expect(platformApiDnsRecordName("auth")).toBe("api.auth");
  });

  it("projects Host STUDIO_HOST_PUBLIC_URL from resource", () => {
    expect(
      hostPublicUrlEnvFromResourceUrl(
        "https://api.auth.glassboxcomputer.site/",
      ),
    ).toEqual({
      STUDIO_HOST_PUBLIC_URL: "https://api.auth.glassboxcomputer.site",
    });
    expect(hostPublicUrlEnvFromResourceUrl("not-a-url")).toBeNull();
  });

  it("parses api.{slug} from Host public URL", () => {
    expect(
      parsePlatformApiSlug("https://api.auth.glassboxcomputer.site"),
    ).toBe("auth");
    expect(parsePlatformApiSlug("api.acme.glassboxcomputer.site")).toBe("acme");
    expect(parsePlatformApiSlug("api.glassboxcomputer.site")).toBeNull();
    expect(parsePlatformApiSlug("https://127.0.0.1:3847")).toBeNull();
  });
});
