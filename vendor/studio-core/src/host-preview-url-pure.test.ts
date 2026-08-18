import { describe, expect, it } from "vitest";
import {
  isLoopbackHostname,
  preferLocalhostLoopbackUrl,
  preferredLoopbackHostname,
  rewriteLivePreviewBaseUrl,
  rewriteLoopbackUrlForRemoteClient,
} from "./host-preview-url-pure.js";

describe("isLoopbackHostname", () => {
  it("detects loopback hosts", () => {
    expect(isLoopbackHostname("127.0.0.1")).toBe(true);
    expect(isLoopbackHostname("localhost")).toBe(true);
    expect(isLoopbackHostname("LOCALHOST")).toBe(true);
    expect(isLoopbackHostname("[::1]")).toBe(true);
    expect(isLoopbackHostname("::1")).toBe(true);
  });

  it("rejects remote hosts", () => {
    expect(isLoopbackHostname("100.64.1.2")).toBe(false);
    expect(isLoopbackHostname("home-laptop.tailnet.ts.net")).toBe(false);
  });
});

describe("preferLocalhostLoopbackUrl", () => {
  it("rewrites 127.0.0.1 → localhost when Studio is on loopback", () => {
    expect(
      preferLocalhostLoopbackUrl(
        "http://127.0.0.1:8080/summer?as-theme=dark",
        "localhost",
      ),
    ).toBe("http://localhost:8080/summer?as-theme=dark");
    expect(
      preferLocalhostLoopbackUrl("http://127.0.0.1:8080/", "127.0.0.1"),
    ).toBe("http://localhost:8080/");
  });

  it("leaves localhost alone", () => {
    expect(
      preferLocalhostLoopbackUrl("http://localhost:8789/blog", "localhost"),
    ).toBe("http://localhost:8789/blog");
  });

  it("does not rewrite when Studio page is remote", () => {
    expect(
      preferLocalhostLoopbackUrl("http://127.0.0.1:9889/", "100.64.1.2"),
    ).toBe("http://127.0.0.1:9889/");
  });
});

describe("preferredLoopbackHostname", () => {
  it("maps any loopback page host to localhost", () => {
    expect(preferredLoopbackHostname("127.0.0.1")).toBe("localhost");
    expect(preferredLoopbackHostname("localhost")).toBe("localhost");
    expect(preferredLoopbackHostname("::1")).toBe("localhost");
  });
});

describe("rewriteLoopbackUrlForRemoteClient", () => {
  it("leaves URLs alone when the page is on loopback", () => {
    expect(
      rewriteLoopbackUrlForRemoteClient("http://127.0.0.1:9889/blog", {
        hostname: "127.0.0.1",
        protocol: "http:",
      }),
    ).toBe("http://127.0.0.1:9889/blog");
  });

  it("rewrites loopback Live base to the page hostname for phone/Tailscale", () => {
    expect(
      rewriteLoopbackUrlForRemoteClient("http://127.0.0.1:9889/", {
        hostname: "100.64.1.2",
        protocol: "http:",
      }),
    ).toBe("https://100.64.1.2:9889/");

    expect(
      rewriteLoopbackUrlForRemoteClient(
        "http://localhost:8789/about?as-preview=1",
        {
          hostname: "home-laptop.tail123.ts.net",
          protocol: "https:",
        },
      ),
    ).toBe("https://home-laptop.tail123.ts.net:8789/about?as-preview=1");
  });

  it("maps Studio shell :4400 to default HTTPS (Serve :443), keeps Live ports", () => {
    expect(
      rewriteLoopbackUrlForRemoteClient("http://localhost:4400/?as-preview=1", {
        hostname: "studio.tail0a3a18.ts.net",
        protocol: "https:",
        port: "",
      }),
    ).toBe("https://studio.tail0a3a18.ts.net/?as-preview=1");

    expect(
      rewriteLoopbackUrlForRemoteClient("http://127.0.0.1:4400/", {
        hostname: "studio.tail0a3a18.ts.net",
        protocol: "https:",
        port: "443",
      }),
    ).toBe("https://studio.tail0a3a18.ts.net/");

    // Page opened on explicit :4400 Serve → keep shell port on iframe.
    expect(
      rewriteLoopbackUrlForRemoteClient("http://localhost:4400/", {
        hostname: "studio.tail0a3a18.ts.net",
        protocol: "https:",
        port: "4400",
      }),
    ).toBe("https://studio.tail0a3a18.ts.net:4400/");
  });

  it("does not rewrite non-loopback targets", () => {
    expect(
      rewriteLoopbackUrlForRemoteClient("https://demo.workers.dev", {
        hostname: "100.64.1.2",
        protocol: "http:",
      }),
    ).toBe("https://demo.workers.dev");
  });

  it("honors explicit previewHostname override", () => {
    expect(
      rewriteLoopbackUrlForRemoteClient("http://127.0.0.1:9889/x", {
        hostname: "studio.tailnet.ts.net",
        protocol: "https:",
        previewHostname: "home-laptop.tailnet.ts.net",
      }),
    ).toBe("https://home-laptop.tailnet.ts.net:9889/x");
  });

  it("returns empty / invalid input unchanged", () => {
    expect(
      rewriteLoopbackUrlForRemoteClient("", {
        hostname: "100.64.1.2",
        protocol: "http:",
      }),
    ).toBe("");
  });
});

describe("rewriteLivePreviewBaseUrl", () => {
  it("prefers localhost for loopback Studio", () => {
    expect(
      rewriteLivePreviewBaseUrl("http://127.0.0.1:8080/x", {
        hostname: "localhost",
        protocol: "http:",
      }),
    ).toBe("http://localhost:8080/x");
  });

  it("still rewrites for remote Studio", () => {
    expect(
      rewriteLivePreviewBaseUrl("http://127.0.0.1:8080/x", {
        hostname: "100.64.1.2",
        protocol: "http:",
      }),
    ).toBe("https://100.64.1.2:8080/x");
  });
});
