/**
 * MCP OAuth client (Host as client) — PKCE, token file shape, paths (pure).
 * Hermes parity: ~/.glassbox-studio/mcp-tokens/<serverId>.json
 */

export type McpOAuthTokenFile = {
  version: 1;
  serverId: string;
  /** MCP resource URL (audience). */
  resource: string;
  accessToken: string;
  refreshToken?: string;
  /** Unix ms when access token expires. */
  expiresAt?: number;
  tokenType?: string;
  scope?: string;
  /** AS token endpoint for refresh. */
  tokenEndpoint?: string;
  clientId?: string;
};

export type McpOAuthPendingSession = {
  serverId: string;
  resource: string;
  state: string;
  codeVerifier: string;
  authorizeUrl: string;
  tokenEndpoint: string;
  clientId: string;
  redirectUri: string;
  createdAt: number;
};

export function mcpOAuthTokensDir(studioHome: string): string {
  const home = studioHome.replace(/\/+$/, "");
  return `${home}/mcp-tokens`;
}

export function mcpOAuthTokenPath(studioHome: string, serverId: string): string {
  const id = serverId.trim().replace(/[^a-zA-Z0-9._-]+/g, "_") || "unnamed";
  return `${mcpOAuthTokensDir(studioHome)}/${id}.json`;
}

export function parseMcpOAuthTokenFile(raw: unknown): McpOAuthTokenFile | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.serverId !== "string" || !o.serverId.trim()) return null;
  if (typeof o.accessToken !== "string" || !o.accessToken.trim()) return null;
  if (typeof o.resource !== "string" || !o.resource.trim()) return null;
  return {
    version: 1,
    serverId: o.serverId.trim(),
    resource: o.resource.trim(),
    accessToken: o.accessToken.trim(),
    refreshToken:
      typeof o.refreshToken === "string" ? o.refreshToken : undefined,
    expiresAt:
      typeof o.expiresAt === "number" && Number.isFinite(o.expiresAt)
        ? o.expiresAt
        : undefined,
    tokenType: typeof o.tokenType === "string" ? o.tokenType : undefined,
    scope: typeof o.scope === "string" ? o.scope : undefined,
    tokenEndpoint:
      typeof o.tokenEndpoint === "string" ? o.tokenEndpoint : undefined,
    clientId: typeof o.clientId === "string" ? o.clientId : undefined,
  };
}

export function mcpOAuthAccessTokenFresh(
  file: McpOAuthTokenFile,
  nowMs: number = Date.now(),
  skewMs: number = 60_000,
): boolean {
  if (!file.expiresAt) return true;
  return file.expiresAt > nowMs + skewMs;
}

/** base64url without padding (Node + browser Buffer-free). */
export function base64UrlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]!);
  }
  const b64 =
    typeof btoa === "function"
      ? btoa(bin)
      : Buffer.from(bytes).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function buildMcpOAuthAuthorizeUrl(input: {
  authorizationEndpoint: string;
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  resource?: string;
  scope?: string;
}): string {
  const u = new URL(input.authorizationEndpoint);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("client_id", input.clientId);
  u.searchParams.set("redirect_uri", input.redirectUri);
  u.searchParams.set("state", input.state);
  u.searchParams.set("code_challenge", input.codeChallenge);
  u.searchParams.set("code_challenge_method", "S256");
  if (input.resource?.trim()) {
    u.searchParams.set("resource", input.resource.trim());
  }
  if (input.scope?.trim()) {
    u.searchParams.set("scope", input.scope.trim());
  }
  return u.toString();
}

export type McpOAuthAsMetadata = {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  registrationEndpoint?: string;
};

export function parseOAuthAsMetadata(raw: unknown): McpOAuthAsMetadata | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const authorizationEndpoint =
    typeof o.authorization_endpoint === "string"
      ? o.authorization_endpoint.trim()
      : "";
  const tokenEndpoint =
    typeof o.token_endpoint === "string" ? o.token_endpoint.trim() : "";
  if (!authorizationEndpoint || !tokenEndpoint) return null;
  return {
    authorizationEndpoint,
    tokenEndpoint,
    registrationEndpoint:
      typeof o.registration_endpoint === "string"
        ? o.registration_endpoint.trim()
        : undefined,
  };
}

export function parseProtectedResourceMetadata(raw: unknown): {
  authorizationServers: string[];
} | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const list = Array.isArray(o.authorization_servers)
    ? o.authorization_servers.filter(
        (x): x is string => typeof x === "string" && x.trim().length > 0,
      )
    : [];
  if (!list.length) return null;
  return { authorizationServers: list.map((s) => s.trim()) };
}
