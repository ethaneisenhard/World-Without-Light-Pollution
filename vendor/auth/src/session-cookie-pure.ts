/**
 * Lightweight signed session cookie for Starter Workers (pre–full remix mount).
 * Format: base64url(userId).base64url(hmac)
 */

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacSha256(secret: string, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return new Uint8Array(sig);
}

export async function signSessionUserId(userId: string, secret: string): Promise<string> {
  const payload = b64url(new TextEncoder().encode(userId));
  const mac = b64url(await hmacSha256(secret, payload));
  return `${payload}.${mac}`;
}

export async function verifySessionUserId(
  token: string,
  secret: string,
): Promise<string | null> {
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return null;
  const expected = b64url(await hmacSha256(secret, payload));
  if (expected.length !== mac.length) return null;
  let ok = 0;
  for (let i = 0; i < mac.length; i++) ok |= mac.charCodeAt(i) ^ expected.charCodeAt(i);
  if (ok !== 0) return null;
  try {
    return new TextDecoder().decode(fromB64url(payload));
  } catch {
    return null;
  }
}

export const STARTER_SESSION_COOKIE = "as_auth";

export function parseCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export function sessionSetCookieHeader(token: string, secure: boolean): string {
  const parts = [
    `${STARTER_SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}
