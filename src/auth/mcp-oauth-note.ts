/**
 * MCP OAuth (epicflare/Kody) — enable when shipping remote MCP on this Worker:
 *
 * ```ts
 * import OAuthProvider from "@cloudflare/workers-oauth-provider";
 * import { createStudioMcpOAuthOptions } from "@glassbox-studio/auth";
 * export default new OAuthProvider(createStudioMcpOAuthOptions({
 *   apiHandler: { fetch: handleMcp },
 *   defaultHandler: { fetch: handleApp },
 * }));
 * ```
 *
 * Requires `OAUTH_KV` in wrangler.jsonc. Fetch order: OAuth → MCP → assets → app.
 */
export {
  MCP_OAUTH_ENDPOINTS,
  MCP_WORKER_FETCH_ORDER,
  createStudioMcpOAuthOptions,
} from "@glassbox-studio/auth";
