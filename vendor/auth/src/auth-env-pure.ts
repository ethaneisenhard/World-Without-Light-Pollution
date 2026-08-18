import type { AuthEnv } from "./types.js";

export function readAuthEnv(source: Record<string, string | undefined>): AuthEnv | null {
  const sessionSecret = source.SESSION_SECRET?.trim();
  const googleClientId = source.GOOGLE_CLIENT_ID?.trim();
  const googleClientSecret = source.GOOGLE_CLIENT_SECRET?.trim();
  const appOrigin = source.APP_ORIGIN?.trim() || "http://127.0.0.1:4400";

  if (!sessionSecret || !googleClientId || !googleClientSecret) return null;

  return {
    sessionSecret,
    googleClientId,
    googleClientSecret,
    appOrigin,
  };
}
