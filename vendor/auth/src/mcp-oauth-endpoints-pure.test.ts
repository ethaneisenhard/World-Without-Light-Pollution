import { describe, expect, it } from "vitest";
import {
  MCP_OAUTH_ENDPOINTS,
  MCP_WORKER_FETCH_ORDER,
} from "./mcp-oauth-endpoints-pure.js";

describe("MCP_OAUTH_ENDPOINTS", () => {
  it("matches epicflare-shaped paths", () => {
    expect(MCP_OAUTH_ENDPOINTS.mcp).toBe("/mcp");
    expect(MCP_OAUTH_ENDPOINTS.token).toBe("/oauth/token");
    expect(MCP_OAUTH_ENDPOINTS.protectedResourceMetadata).toContain(
      "oauth-protected-resource",
    );
  });

  it("documents Worker fetch order with oauth before mcp", () => {
    expect(MCP_WORKER_FETCH_ORDER[0]).toBe("oauth-provider");
    expect(MCP_WORKER_FETCH_ORDER[1]).toBe("mcp");
  });
});
