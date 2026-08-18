/**
 * Google token + profile exchange — deps inject fetch for tests.
 */
import type { GoogleProfile } from "./user-pure.js";

export type GoogleTokenExchangeDeps = {
  fetch?: typeof fetch;
};

export type GoogleTokenResult =
  | { ok: true; accessToken: string }
  | { ok: false; error: string };

export type GoogleProfileResult =
  | { ok: true; profile: GoogleProfile }
  | { ok: false; error: string };

export async function exchangeGoogleAuthorizationCode(
  deps: GoogleTokenExchangeDeps,
  input: {
    code: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  },
): Promise<GoogleTokenResult> {
  const fetchFn = deps.fetch ?? fetch;
  try {
    const res = await fetchFn("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: input.code,
        client_id: input.clientId,
        client_secret: input.clientSecret,
        redirect_uri: input.redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };
    if (!res.ok || !body.access_token) {
      return {
        ok: false,
        error: body.error_description || body.error || `token_http_${res.status}`,
      };
    }
    return { ok: true, accessToken: body.access_token };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "token_exchange_failed",
    };
  }
}

export async function fetchGoogleUserProfile(
  deps: GoogleTokenExchangeDeps,
  accessToken: string,
): Promise<GoogleProfileResult> {
  const fetchFn = deps.fetch ?? fetch;
  try {
    const res = await fetchFn("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const body = (await res.json().catch(() => ({}))) as {
      sub?: string;
      email?: string | null;
      name?: string | null;
      error?: string;
    };
    if (!res.ok || !body.sub) {
      return {
        ok: false,
        error: body.error || `userinfo_http_${res.status}`,
      };
    }
    return {
      ok: true,
      profile: {
        sub: body.sub,
        email: body.email,
        name: body.name,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "userinfo_failed",
    };
  }
}
