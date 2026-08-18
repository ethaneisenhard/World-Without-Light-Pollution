/** Collect pageview properties from the browser. */
export function collectPageviewProperties(pageMeta?: {
  pageId?: string;
  pageType?: string;
  locale?: string;
}): Record<string, unknown> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return { page_route: "/", page_url: "/", page_origin: "", search: null, query_params: {} };
  }

  const loc = window.location;
  const search = loc.search || null;
  const queryParams = parseQueryParams(search);

  return {
    page_url: loc.href,
    page_origin: loc.origin,
    page_route: loc.pathname,
    search,
    query_params: queryParams,
    hash: loc.hash || null,
    page_title: document.title,
    page_id: pageMeta?.pageId ?? null,
    page_type: pageMeta?.pageType ?? null,
    locale: pageMeta?.locale ?? null,
    browser_locale: typeof navigator !== "undefined" ? navigator.language : null,
    referrer: document.referrer || null,
    utm_source: queryParams.utm_source ?? null,
    utm_medium: queryParams.utm_medium ?? null,
    utm_campaign: queryParams.utm_campaign ?? null,
    utm_term: queryParams.utm_term ?? null,
    utm_content: queryParams.utm_content ?? null,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    screen_width: typeof screen !== "undefined" ? screen.width : null,
    screen_height: typeof screen !== "undefined" ? screen.height : null,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
  };
}

function parseQueryParams(search: string | null): Record<string, string> {
  if (!search || search === "?") return {};
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const out: Record<string, string> = {};
  for (const [k, v] of params.entries()) out[k] = v;
  return out;
}
