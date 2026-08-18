import { describe, expect, it } from "vitest";
import {
  FALLBACK_REMOTE_STUDIO_URL,
  normalizeRemoteStudioUrl,
  remoteStudioHostLabel,
  remoteStudioHttpsUrlFromDnsName,
  remoteStudioUrlFromHostname,
  resolveDefaultRemoteStudioUrl,
  resolveRemoteStudioUrlSync,
} from "./host-remote-pure.js";

describe("host-remote-pure", () => {
  it("builds https studio URL from MagicDNS", () => {
    expect(remoteStudioHttpsUrlFromDnsName("studio.tail0a3a18.ts.net.")).toBe(
      "https://studio.tail0a3a18.ts.net/",
    );
  });

  it("returns empty for blank dns", () => {
    expect(remoteStudioHttpsUrlFromDnsName("")).toBe("");
  });

  it("labels host for chip", () => {
    expect(
      remoteStudioHostLabel("https://studio.tail0a3a18.ts.net/"),
    ).toBe("studio.tail0a3a18.ts.net");
  });

  it("infers phone URL from .ts.net location", () => {
    expect(remoteStudioUrlFromHostname("studio.tail0a3a18.ts.net")).toBe(
      "https://studio.tail0a3a18.ts.net/",
    );
    expect(remoteStudioUrlFromHostname("127.0.0.1")).toBe("");
  });

  it("normalizes cached https MagicDNS URLs", () => {
    expect(
      normalizeRemoteStudioUrl("https://studio.tail0a3a18.ts.net/foo?x=1"),
    ).toBe("https://studio.tail0a3a18.ts.net/");
    expect(normalizeRemoteStudioUrl("http://127.0.0.1:4400/")).toBe("");
  });

  it("resolves sync: host wins over cache", () => {
    expect(
      resolveRemoteStudioUrlSync({
        hostname: "studio.tail0a3a18.ts.net",
        cachedUrl: "https://other.tail0a3a18.ts.net/",
      }),
    ).toBe("https://studio.tail0a3a18.ts.net/");
    expect(
      resolveRemoteStudioUrlSync({
        hostname: "127.0.0.1",
        cachedUrl: "https://studio.tail0a3a18.ts.net/",
      }),
    ).toBe("https://studio.tail0a3a18.ts.net/");
  });

  it("default remote URL prefers AS_REMOTE_STUDIO_URL over fallback", () => {
    expect(resolveDefaultRemoteStudioUrl({})).toBe(FALLBACK_REMOTE_STUDIO_URL);
    expect(
      resolveDefaultRemoteStudioUrl({
        AS_REMOTE_STUDIO_URL: "https://studio.tailcustom.ts.net/app",
      }),
    ).toBe("https://studio.tailcustom.ts.net/");
    expect(
      resolveDefaultRemoteStudioUrl({
        STUDIO_REMOTE_URL: "https://alt.tail0a3a18.ts.net/",
      }),
    ).toBe("https://alt.tail0a3a18.ts.net/");
  });
});
