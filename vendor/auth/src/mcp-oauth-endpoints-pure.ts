/**
 * Epicflare / Kody MCP OAuth endpoint constants.
 * Worker entry order: OAuth provider → MCP → assets → app router.
 * @see https://github.com/epicweb-dev/epicflare/blob/main/docs/architecture/request-lifecycle.md
 */

export const MCP_OAUTH_ENDPOINTS = {
  authorize: "/oauth/authorize",
  authorizeInfo: "/oauth/authorize-info",
  callback: "/oauth/callback",
  token: "/oauth/token",
  register: "/oauth/register",
  mcp: "/mcp",
  protectedResourceMetadata: "/.well-known/oauth-protected-resource",
  protectedResourceMetadataMcp: "/.well-known/oauth-protected-resource/mcp",
} as const;

/** Documented Worker fetch order (epicflare/Kody). */
export const MCP_WORKER_FETCH_ORDER = [
  "oauth-provider", // @cloudflare/workers-oauth-provider handles /oauth/token, /oauth/register, PRM
  "mcp", // /mcp requires bearer token
  "assets",
  "app-router",
] as const;

export type McpOAuthEndpointKey = keyof typeof MCP_OAUTH_ENDPOINTS;
