/**
 * Platform site apex (`glassboxcomputer.site`) is not Studio — company lives on `.com`.
 * Apex + www → permanent redirect to the company origin (marketing + provision).
 */

import { isLoopbackHostname } from "../host-preview-url-pure.js";

export function normalizeHostname(hostHeader: string): string {
  return hostHeader.trim().toLowerCase().split(":")[0] ?? "";
}

export function normalizeCompanyOrigin(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  try {
    const u = new URL(t.includes("://") ? t : `https://${t}`);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return u.origin;
  } catch {
    return null;
  }
}

/**
 * When Host is site apex or www, return absolute Location for 301.
 * Preserves path + query on the company origin.
 *
 * Loopback `requestHostname` (local wrangler / edge) never redirects — custom
 * `routes` + `workers_dev: false` can present the apex Host on 127.0.0.1 fetches.
 */
export function studioSiteApexCompanyRedirectUrl(input: {
  hostHeader: string;
  siteBaseDomain: string;
  companyOrigin: string;
  pathname: string;
  search: string;
  /** `new URL(request.url).hostname` — skip 301 when dogfooding on loopback. */
  requestHostname?: string;
}): string | null {
  if (
    typeof input.requestHostname === "string" &&
    input.requestHostname.trim() &&
    isLoopbackHostname(input.requestHostname)
  ) {
    return null;
  }

  const host = normalizeHostname(input.hostHeader);
  const base = normalizeHostname(input.siteBaseDomain);
  if (!host || !base) return null;
  if (host !== base && host !== `www.${base}`) return null;

  const company = normalizeCompanyOrigin(input.companyOrigin);
  if (!company) return null;

  // Never bounce company → itself if misconfigured to same host.
  try {
    if (new URL(company).hostname === host) return null;
  } catch {
    return null;
  }

  const path =
    input.pathname.startsWith("/") && !input.pathname.startsWith("//")
      ? input.pathname
      : "/";
  const search =
    input.search && input.search !== "?"
      ? input.search.startsWith("?")
        ? input.search
        : `?${input.search}`
      : "";
  return `${company}${path}${search}`;
}
