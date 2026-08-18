/**
 * Password-reset token lifecycle (pure crypto + expiry). No I/O.
 */

export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256Hex(raw: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(raw),
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createPasswordResetToken(): Promise<{
  raw: string;
  hash: string;
}> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const raw = b64url(bytes);
  const hash = await sha256Hex(raw);
  return { raw, hash };
}

export async function hashPasswordResetToken(raw: string): Promise<string> {
  return sha256Hex(raw.trim());
}

export function passwordResetExpiresAtIso(nowMs = Date.now()): string {
  return new Date(nowMs + PASSWORD_RESET_TTL_MS).toISOString();
}

export function isPasswordResetExpired(
  expiresAtIso: string,
  nowMs = Date.now(),
): boolean {
  const t = Date.parse(expiresAtIso);
  if (Number.isNaN(t)) return true;
  return t <= nowMs;
}

export function buildPasswordResetUrl(appOrigin: string, rawToken: string): string {
  const u = new URL("/reset-password", appOrigin);
  u.searchParams.set("token", rawToken);
  return u.toString();
}
