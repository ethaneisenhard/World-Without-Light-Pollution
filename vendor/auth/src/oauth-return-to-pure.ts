/**
 * OAuth returnTo for multi-tenant Studio (`{slug}.browserui.site`).
 * Callback may run on the site apex; returnTo must bounce back to the tenant host.
 */

export function resolveOAuthReturnTo(input: {
  requestUrl: string;
  rawReturnTo: string | null | undefined;
  fallbackPath: string;
  /** e.g. browserui.site — allow apex + subdomains only */
  allowedSiteBaseDomain?: string | null;
}): string {
  const fallback = input.fallbackPath.startsWith("/")
    ? input.fallbackPath
    : "/";
  const raw = (input.rawReturnTo ?? "").trim() || fallback;
  const base = (input.allowedSiteBaseDomain ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  let url: URL;
  try {
    url = raw.startsWith("http://") || raw.startsWith("https://")
      ? new URL(raw)
      : new URL(raw.startsWith("/") ? raw : `/${raw}`, input.requestUrl);
  } catch {
    return new URL(fallback, input.requestUrl).href;
  }

  if (!base) {
    // Single-origin apps — keep relative path when same host.
    try {
      const req = new URL(input.requestUrl);
      if (url.origin === req.origin) {
        return `${url.pathname}${url.search}` || fallback;
      }
    } catch {
      /* fall through */
    }
    return `${url.pathname}${url.search}` || fallback;
  }

  const host = url.hostname.toLowerCase();
  const allowed = host === base || host.endsWith(`.${base}`);
  if (!allowed) {
    return new URL(fallback, input.requestUrl).href;
  }

  // Absolute — callback host may differ from tenant host.
  return url.href;
}
