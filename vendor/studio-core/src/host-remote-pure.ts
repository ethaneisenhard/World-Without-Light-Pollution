/**
 * Host remote access URLs (Tailscale MagicDNS / Serve).
 */

/** localStorage key — last known phone URL (stable across boots). */
export const REMOTE_STUDIO_URL_STORAGE_KEY = "as-remote-studio-url";

/**
 * Last-resort Preview Tailnet href when env/cache/host are empty.
 * Prefer `AS_REMOTE_STUDIO_URL` / `resolveDefaultRemoteStudioUrl`.
 */
export const FALLBACK_REMOTE_STUDIO_URL =
  "https://studio.tail0a3a18.ts.net/";

/** Env keys that may override the Tailnet Preview default (Node / Worker). */
export type RemoteStudioEnv = {
  AS_REMOTE_STUDIO_URL?: string;
  STUDIO_REMOTE_URL?: string;
};

/**
 * Config seam for the product Tailnet default — env first, then safe fallback.
 * Pure: pass `env` explicitly (no process global in browser bundles).
 */
export function resolveDefaultRemoteStudioUrl(
  env: RemoteStudioEnv = {},
): string {
  const fromEnv = normalizeRemoteStudioUrl(
    env.AS_REMOTE_STUDIO_URL ?? env.STUDIO_REMOTE_URL ?? "",
  );
  return fromEnv || FALLBACK_REMOTE_STUDIO_URL;
}

/** Normalize MagicDNS name → Studio HTTPS URL for phone bookmarks. */
export function remoteStudioHttpsUrlFromDnsName(dnsName: string): string {
  const host = dnsName.trim().replace(/\.$/, "");
  if (!host) return "";
  return `https://${host}/`;
}

/**
 * If Studio is already open on MagicDNS, the phone URL is this host.
 * Empty for loopback / LAN — those need Tailscale Serve / cache.
 */
export function remoteStudioUrlFromHostname(hostname: string): string {
  const host = hostname.trim().replace(/\.$/, "").toLowerCase();
  if (!host.endsWith(".ts.net")) return "";
  return `https://${host}/`;
}

/** Prefer live host, then cached string — first non-empty wins. */
export function resolveRemoteStudioUrlSync(input: {
  hostname?: string | null;
  cachedUrl?: string | null;
}): string {
  const fromHost = remoteStudioUrlFromHostname(input.hostname ?? "");
  if (fromHost) return fromHost;
  return normalizeRemoteStudioUrl(input.cachedUrl ?? "");
}

/** Ensure trailing slash for stable clipboard / compare. */
export function normalizeRemoteStudioUrl(url: string): string {
  const t = url.trim();
  if (!t) return "";
  try {
    const u = new URL(t);
    if (!u.hostname.endsWith(".ts.net")) return "";
    u.pathname = "/";
    u.search = "";
    u.hash = "";
    return u.toString();
  } catch {
    return "";
  }
}

/** Short label for topbar chip (hostname only). */
export function remoteStudioHostLabel(remoteStudioUrl: string): string {
  try {
    return new URL(remoteStudioUrl).host;
  } catch {
    return remoteStudioUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}
