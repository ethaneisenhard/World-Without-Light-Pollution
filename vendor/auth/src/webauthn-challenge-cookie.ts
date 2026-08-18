/**
 * Kody / Epic Stack pattern: WebAuthn challenge in a short-lived signed cookie
 * so Cloudflare Workers need no cross-isolate memory for ceremonies.
 */
import { createCookie } from "remix/cookie";
import type { ChallengeStore } from "./passkey-webauthn.js";

export const WEBAUTHN_CHALLENGE_COOKIE = "as_webauthn_challenge";
const CHALLENGE_MAX_AGE_SEC = 60 * 10;

export type WebAuthnChallengePayload = {
  key: string;
  challenge: string;
};

function isPayload(value: unknown): value is WebAuthnChallengePayload {
  if (!value || typeof value !== "object") return false;
  const rec = value as Record<string, unknown>;
  return (
    typeof rec.key === "string" &&
    rec.key.length > 0 &&
    typeof rec.challenge === "string" &&
    rec.challenge.length > 0
  );
}

export function createWebAuthnChallengeCookie(secret: string) {
  if (!secret.trim()) {
    throw new Error("SESSION_SECRET required for WebAuthn challenge cookie");
  }
  return createCookie(WEBAUTHN_CHALLENGE_COOKIE, {
    secrets: [secret],
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: CHALLENGE_MAX_AGE_SEC,
  });
}

export async function readWebAuthnChallengePayload(
  cookie: ReturnType<typeof createCookie>,
  request: Request,
): Promise<WebAuthnChallengePayload | null> {
  const header = request.headers.get("Cookie");
  if (!header) return null;
  const stored = await cookie.parse(header);
  if (!stored || typeof stored !== "string") return null;
  try {
    const parsed = JSON.parse(stored) as unknown;
    return isPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Per-request ChallengeStore backed by the challenge cookie.
 * Call `applyToResponse` before returning so Set-Cookie is attached.
 */
export function createRequestCookieChallengeStore(input: {
  cookie: ReturnType<typeof createCookie>;
  request: Request;
  /** Prefer HTTPS cookie flag from APP_ORIGIN / request. */
  secure: boolean;
}): {
  store: ChallengeStore;
  applyToResponse: (response: Response) => Promise<Response>;
} {
  let loaded: WebAuthnChallengePayload | null | undefined;
  let staged: WebAuthnChallengePayload | null | "clear" = null;

  async function ensureLoaded() {
    if (loaded !== undefined) return loaded;
    loaded = await readWebAuthnChallengePayload(input.cookie, input.request);
    return loaded;
  }

  const store: ChallengeStore = {
    async set(key, challenge) {
      staged = { key, challenge };
    },
    async get(key) {
      if (staged && staged !== "clear" && staged.key === key) {
        return staged.challenge;
      }
      if (staged === "clear") return null;
      const cur = await ensureLoaded();
      return cur?.key === key ? cur.challenge : null;
    },
    async clear(_key) {
      staged = "clear";
    },
  };

  return {
    store,
    async applyToResponse(response) {
      if (staged === null) return response;
      const headers = new Headers(response.headers);
      if (staged === "clear") {
        headers.append(
          "Set-Cookie",
          await input.cookie.serialize("", {
            secure: input.secure,
            maxAge: 0,
            expires: new Date(0),
          }),
        );
      } else {
        headers.append(
          "Set-Cookie",
          await input.cookie.serialize(JSON.stringify(staged), {
            secure: input.secure,
          }),
        );
      }
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    },
  };
}

export function webauthnCookieSecureFromRequest(
  request: Request,
  appOrigin?: string,
): boolean {
  if (appOrigin?.startsWith("https://")) return true;
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}
