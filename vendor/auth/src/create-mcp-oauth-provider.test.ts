import { describe, expect, it } from "vitest";
import { createStudioMcpOAuthOptions } from "./create-mcp-oauth-provider.js";
import { MCP_OAUTH_ENDPOINTS } from "./mcp-oauth-endpoints-pure.js";

describe("createStudioMcpOAuthOptions", () => {
  it("builds epicflare-shaped provider options for /mcp", () => {
    const stub = { fetch: () => new Response("ok") };
    const opts = createStudioMcpOAuthOptions({
      apiHandler: stub,
      defaultHandler: stub,
    });
    expect(opts.apiRoute).toBe(MCP_OAUTH_ENDPOINTS.mcp);
    expect(opts.tokenEndpoint).toBe("/oauth/token");
    expect(opts.authorizeEndpoint).toBe("/oauth/authorize");
    expect(opts.scopesSupported).toContain("mcp:tools");
    expect(opts.allowPlainPKCE).toBe(false);
  });
});
