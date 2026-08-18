import { describe, expect, it } from "vitest";
import {
  base64UrlEncode,
  buildMcpOAuthAuthorizeUrl,
  mcpOAuthAccessTokenFresh,
  mcpOAuthTokenPath,
  parseMcpOAuthTokenFile,
  parseOAuthAsMetadata,
  parseProtectedResourceMetadata,
} from "./mcp-oauth-client-pure.js";

describe("mcp-oauth-client-pure", () => {
  it("token path under studio home", () => {
    expect(mcpOAuthTokenPath("/tmp/as", "linear")).toBe(
      "/tmp/as/mcp-tokens/linear.json",
    );
    expect(mcpOAuthTokenPath("/tmp/as/", "a/b")).toBe(
      "/tmp/as/mcp-tokens/a_b.json",
    );
  });

  it("parses token file", () => {
    const f = parseMcpOAuthTokenFile({
      version: 1,
      serverId: "linear",
      resource: "https://mcp.linear.app/mcp",
      accessToken: "tok",
      expiresAt: Date.now() + 120_000,
    });
    expect(f?.accessToken).toBe("tok");
    expect(mcpOAuthAccessTokenFresh(f!)).toBe(true);
  });

  it("builds authorize URL with PKCE + resource", () => {
    const url = buildMcpOAuthAuthorizeUrl({
      authorizationEndpoint: "https://as.example/authorize",
      clientId: "glassbox-studio",
      redirectUri: "http://127.0.0.1:3847/api/studio/mcp/oauth/callback",
      state: "st",
      codeChallenge: "ch",
      resource: "https://mcp.example/mcp",
      scope: "mcp:tools",
    });
    const u = new URL(url);
    expect(u.searchParams.get("code_challenge_method")).toBe("S256");
    expect(u.searchParams.get("resource")).toBe("https://mcp.example/mcp");
  });

  it("parses AS + PRM metadata", () => {
    expect(
      parseOAuthAsMetadata({
        authorization_endpoint: "https://as/authorize",
        token_endpoint: "https://as/token",
      })?.tokenEndpoint,
    ).toBe("https://as/token");
    expect(
      parseProtectedResourceMetadata({
        authorization_servers: ["https://as.example"],
      })?.authorizationServers[0],
    ).toBe("https://as.example");
  });

  it("base64UrlEncode", () => {
    expect(base64UrlEncode(new Uint8Array([1, 2, 3]))).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
