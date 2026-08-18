/**
 * Worker-safe Google OAuth helpers (no remix/auth). Starter + Studio fetch hosts.
 */

export type GoogleOAuthStatePayload = {
  /** CSRF nonce */
  n: string;
  /** Safe return path */
  r: string;
};

export function buildGoogleAuthorizeUrl(input: {
  clientId: string;
  redirectUri: string;
  state: string;
  scope?: string;
}): string {
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", input.clientId);
  u.searchParams.set("redirect_uri", input.redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", input.scope ?? "openid email profile");
  u.searchParams.set("state", input.state);
  u.searchParams.set("access_type", "offline");
  u.searchParams.set("prompt", "select_account");
  return u.toString();
}

export function encodeGoogleOAuthStatePayload(payload: GoogleOAuthStatePayload): string {
  return JSON.stringify(payload);
}

export function parseGoogleOAuthStatePayload(raw: string): GoogleOAuthStatePayload | null {
  try {
    const parsed = JSON.parse(raw) as Partial<GoogleOAuthStatePayload>;
    if (typeof parsed.n !== "string" || !parsed.n) return null;
    const r =
      typeof parsed.r === "string" && parsed.r.startsWith("/") && !parsed.r.startsWith("//")
        ? parsed.r
        : "/app";
    return { n: parsed.n, r };
  } catch {
    return null;
  }
}

export function newGoogleOAuthNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
