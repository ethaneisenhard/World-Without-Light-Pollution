/**
 * Options builder for `@cloudflare/workers-oauth-provider` (Kody / epicflare).
 * Host constructs: `new OAuthProvider(createStudioMcpOAuthOptions({...}))`
 * Env must bind `OAUTH_KV` — see package README.
 *
 * Avoid importing the CF package at module load (breaks Node vitest — `cloudflare:` protocol).
 */
import { MCP_OAUTH_ENDPOINTS } from "./mcp-oauth-endpoints-pure.js";

export type StudioMcpOAuthHandlers = {
  apiHandler: unknown;
  defaultHandler: unknown;
  scopesSupported?: string[];
};

/** Epicflare-shaped OAuthProvider options for `/mcp`. */
export function createStudioMcpOAuthOptions(handlers: StudioMcpOAuthHandlers) {
  return {
    apiRoute: MCP_OAUTH_ENDPOINTS.mcp,
    apiHandler: handlers.apiHandler,
    defaultHandler: handlers.defaultHandler,
    authorizeEndpoint: MCP_OAUTH_ENDPOINTS.authorize,
    tokenEndpoint: MCP_OAUTH_ENDPOINTS.token,
    clientRegistrationEndpoint: MCP_OAUTH_ENDPOINTS.register,
    scopesSupported: handlers.scopesSupported ?? ["mcp:tools"],
    allowPlainPKCE: false as const,
  };
}

/**
 * Lazy construct OAuthProvider (Workers runtime only).
 * Prefer `createStudioMcpOAuthOptions` + `new OAuthProvider(...)` in Worker entry.
 */
export async function createStudioMcpOAuthProvider(handlers: StudioMcpOAuthHandlers) {
  const mod = await import("@cloudflare/workers-oauth-provider");
  const OAuthProvider = mod.default ?? mod.OAuthProvider;
  return new OAuthProvider(createStudioMcpOAuthOptions(handlers));
}
