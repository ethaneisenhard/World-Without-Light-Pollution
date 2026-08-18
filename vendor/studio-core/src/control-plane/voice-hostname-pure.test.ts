import { describe, expect, it } from "vitest";
import { PLATFORM_STUDIO_PRIMARY_SLUG } from "./reserved-tenant-slugs-pure.js";
import {
  DEFAULT_VOICE_SITE_BASE_DOMAIN,
  isLegacyBrowseruiVoiceUrl,
  PLATFORM_PRIMARY_VOICE_URL,
  parsePlatformVoiceSlug,
  platformVoiceDnsRecordName,
  platformVoiceHostname,
  platformVoiceUrl,
  platformVoiceUrlFromStudioHostname,
  resolveVoicePublicBaseUrl,
} from "./voice-hostname-pure.js";

describe("voice-hostname-pure", () => {
  it("builds nested voice.{slug}.glassboxcomputer.site", () => {
    expect(platformVoiceHostname("acme")).toBe(
      "voice.acme.glassboxcomputer.site",
    );
    expect(platformVoiceUrl("acme")).toBe(
      "https://voice.acme.glassboxcomputer.site",
    );
    expect(DEFAULT_VOICE_SITE_BASE_DOMAIN).toBe("glassboxcomputer.site");
  });

  it("primary auth shell → voice.auth.…site", () => {
    expect(PLATFORM_STUDIO_PRIMARY_SLUG).toBe("auth");
    expect(platformVoiceUrl("auth")).toBe(
      "https://voice.auth.glassboxcomputer.site",
    );
    expect(PLATFORM_PRIMARY_VOICE_URL).toBe(
      "https://voice.auth.glassboxcomputer.site",
    );
    expect(
      platformVoiceUrlFromStudioHostname("auth.glassboxcomputer.site"),
    ).toBe("https://voice.auth.glassboxcomputer.site");
    expect(
      platformVoiceUrlFromStudioHostname("acme.glassboxcomputer.site"),
    ).toBe("https://voice.acme.glassboxcomputer.site");
    expect(
      platformVoiceUrlFromStudioHostname("voice.glassboxcomputer.site"),
    ).toBeNull();
    expect(
      platformVoiceUrlFromStudioHostname("api.glassboxcomputer.site"),
    ).toBeNull();
  });

  it("rejects empty / invalid slug", () => {
    expect(platformVoiceHostname("")).toBeNull();
    expect(platformVoiceHostname("!!!")).toBeNull();
    expect(platformVoiceUrl("")).toBeNull();
    expect(platformVoiceDnsRecordName("")).toBeNull();
    expect(
      platformVoiceUrlFromStudioHostname("glassboxcomputer.site"),
    ).toBeNull();
  });

  it("parses voice slug + DNS record name", () => {
    expect(parsePlatformVoiceSlug("voice.auth.glassboxcomputer.site")).toBe(
      "auth",
    );
    expect(
      parsePlatformVoiceSlug("https://voice.acme.glassboxcomputer.site/client"),
    ).toBe("acme");
    expect(platformVoiceDnsRecordName("auth")).toBe("voice.auth");
  });

  it("flags legacy browserui Voice hosts", () => {
    expect(isLegacyBrowseruiVoiceUrl("https://voice.desk.browserui.site")).toBe(
      true,
    );
    expect(isLegacyBrowseruiVoiceUrl("voice.desk.browserui.site")).toBe(true);
    expect(
      isLegacyBrowseruiVoiceUrl("https://voice.auth.glassboxcomputer.site"),
    ).toBe(false);
  });

  it("resolveVoicePublicBaseUrl prefers glassbox, ignores browserui env", () => {
    expect(
      resolveVoicePublicBaseUrl({
        configuredUrl: "https://voice.desk.browserui.site",
        studioHost: "auth.glassboxcomputer.site",
      }),
    ).toBe("https://voice.auth.glassboxcomputer.site");
    expect(
      resolveVoicePublicBaseUrl({
        configuredUrl: "https://voice.custom.example/",
        studioHost: "auth.glassboxcomputer.site",
      }),
    ).toBe("https://voice.custom.example");
    expect(
      resolveVoicePublicBaseUrl({
        studioHost: "acme.glassboxcomputer.site",
      }),
    ).toBe("https://voice.acme.glassboxcomputer.site");
    expect(resolveVoicePublicBaseUrl({})).toBe(PLATFORM_PRIMARY_VOICE_URL);
  });
});
