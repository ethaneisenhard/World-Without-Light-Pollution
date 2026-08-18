/**
 * web.search — engine URLs + SERP / SearXNG extractors (no I/O).
 */

export type WebSearchEngine = "searxng" | "brave" | "google";

export type WebSearchResult = {
  title: string;
  url: string;
  snippet: string;
};

export type WebSearchParsed = {
  query: string;
  engine: WebSearchEngine;
  limit: number;
};

const ENGINES = new Set<string>(["searxng", "brave", "google"]);

export function isWebSearchEngine(v: unknown): v is WebSearchEngine {
  return typeof v === "string" && ENGINES.has(v);
}

export function parseWebSearchInput(
  input: Record<string, unknown>,
): { ok: true; value: WebSearchParsed } | { ok: false; error: string } {
  const queryRaw =
    typeof input.query === "string"
      ? input.query
      : typeof input.q === "string"
        ? input.q
        : "";
  const query = queryRaw.trim();
  if (!query) return { ok: false, error: "query required" };
  if (query.length > 500) return { ok: false, error: "query too long (max 500)" };

  let engine: WebSearchEngine = "searxng";
  if (input.engine !== undefined && input.engine !== null && input.engine !== "") {
    if (!isWebSearchEngine(input.engine)) {
      return {
        ok: false,
        error: 'engine must be "searxng", "brave", or "google"',
      };
    }
    engine = input.engine;
  }

  let limit = 5;
  if (input.limit !== undefined && input.limit !== null && input.limit !== "") {
    const n = Number(input.limit);
    if (!Number.isFinite(n) || n < 1) {
      return { ok: false, error: "limit must be a positive number" };
    }
    limit = Math.min(Math.floor(n), 10);
  }

  return { ok: true, value: { query, engine, limit } };
}

/** Default local SearXNG base (scripts/searxng-dev.mjs). */
export const DEFAULT_SEARXNG_URL = "http://127.0.0.1:8888";

/** SearXNG JSON search URL. */
export function searxngSearchUrl(
  baseUrl: string,
  query: string,
  limit: number,
): string {
  const base = baseUrl.trim().replace(/\/$/, "") || DEFAULT_SEARXNG_URL;
  const u = new URL(`${base}/search`);
  u.searchParams.set("q", query);
  u.searchParams.set("format", "json");
  u.searchParams.set("language", "en");
  // Request a bit more than limit — engines vary in fill rate.
  u.searchParams.set("pageno", "1");
  void limit;
  return u.toString();
}

/**
 * Map SearXNG `/search?format=json` body → WebSearchResult[].
 * See https://docs.searxng.org/dev/search_api.html
 */
export function mapSearxngJsonToWebSearchResults(
  body: unknown,
  limit: number,
): WebSearchResult[] {
  if (!body || typeof body !== "object") return [];
  const results = (body as { results?: unknown }).results;
  if (!Array.isArray(results)) return [];
  const out: WebSearchResult[] = [];
  const seen = new Set<string>();
  for (const raw of results) {
    if (out.length >= limit) break;
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Record<string, unknown>;
    const url = typeof row.url === "string" ? row.url.trim() : "";
    const title = typeof row.title === "string" ? row.title.trim() : "";
    if (!url.startsWith("http") || !title) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    const snippet =
      typeof row.content === "string"
        ? row.content.replace(/\s+/g, " ").trim().slice(0, 320)
        : "";
    out.push({
      title: title.replace(/\s+/g, " ").slice(0, 200),
      url,
      snippet,
    });
  }
  return out;
}

/** Search URL for headless Chromium navigation (brave/google scrape). */
export function webSearchUrl(engine: WebSearchEngine, query: string): string {
  const q = encodeURIComponent(query);
  if (engine === "google") {
    return `https://www.google.com/search?q=${q}&hl=en&num=10`;
  }
  if (engine === "searxng") {
    return searxngSearchUrl(DEFAULT_SEARXNG_URL, query, 10);
  }
  return `https://search.brave.com/search?q=${q}&source=web`;
}

function decodeHtmlEntities(raw: string): string {
  return raw
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripTags(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function absUrl(href: string, engine: WebSearchEngine): string | null {
  const h = href.trim();
  if (!h || h.startsWith("#") || h.startsWith("javascript:")) return null;
  if (h.startsWith("/url?")) {
    try {
      const u = new URL(h, "https://www.google.com");
      const q = u.searchParams.get("q") || u.searchParams.get("url");
      if (q?.startsWith("http")) return q;
    } catch {
      /* ignore */
    }
  }
  if (h.startsWith("http://") || h.startsWith("https://")) {
    try {
      const u = new URL(h);
      if (engine === "brave" && u.hostname.endsWith("brave.com")) return null;
      if (engine === "google" && /(^|\.)google\./.test(u.hostname)) return null;
      return u.toString();
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Extract organic results from SERP HTML.
 * Tolerant of Brave / Google markup drift — prefers structured blocks, falls back to anchors.
 */
export function extractWebSearchResultsFromHtml(
  html: string,
  engine: WebSearchEngine,
  limit: number,
): WebSearchResult[] {
  if (engine === "brave") return extractBrave(html, limit);
  return extractGoogle(html, limit);
}

function extractBrave(html: string, limit: number): WebSearchResult[] {
  const out: WebSearchResult[] = [];
  const seen = new Set<string>();

  // Split on data-type="web" open tags; each chunk is one card body until next marker.
  const parts = html.split(/<(?:div|article)[^>]*data-type=["']web["'][^>]*>/i);
  for (let i = 1; i < parts.length && out.length < limit; i++) {
    const block = parts[i] ?? "";
    const link =
      block.match(
        /<a[^>]+href=["']([^"']+)["'][^>]*>[\s\S]*?<[^>]*class=["'][^"']*title[^"']*["'][^>]*>\s*([^<]{3,200})/i,
      ) ||
      block.match(
        /<a[^>]+class=["'][^"']*result-header[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>[\s\S]*?([^<]{3,200})/i,
      ) ||
      block.match(/<a[^>]+href=["']([^"']+)["'][^>]*>\s*(?:<[^>]+>\s*)*([^<]{3,200})/i);
    if (!link) continue;
    const url = absUrl(link[1]!, "brave");
    if (!url || seen.has(url)) continue;
    const title = stripTags(link[2] ?? "").slice(0, 200);
    if (!title) continue;
    const snipMatch =
      block.match(
        /<(?:div|p|span)[^>]*class=["'][^"']*(?:snippet-description|description)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|p|span)>/i,
      ) || block.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    const snippet = snipMatch ? stripTags(snipMatch[1]!).slice(0, 320) : "";
    seen.add(url);
    out.push({ title, url, snippet });
  }

  if (out.length < limit) {
    pushAnchorFallback(html, "brave", limit, out, seen);
  }
  return out.slice(0, limit);
}

function extractGoogle(html: string, limit: number): WebSearchResult[] {
  const out: WebSearchResult[] = [];
  const seen = new Set<string>();

  // Classic organic: <div class="g">…<a href><h3>title</h3>
  const gRe =
    /<div[^>]*class=["'][^"']*\bg\b[^"']*["'][^>]*>([\s\S]*?)(?=<div[^>]*class=["'][^"']*\bg\b|$)/gi;
  let m: RegExpExecArray | null;
  while ((m = gRe.exec(html)) !== null && out.length < limit) {
    const block = m[1] ?? "";
    const link = block.match(
      /<a[^>]+href=["']([^"']+)["'][^>]*>[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>/i,
    );
    if (!link) continue;
    const url = absUrl(link[1]!, "google");
    if (!url || seen.has(url)) continue;
    const title = stripTags(link[2]!).slice(0, 200);
    if (!title) continue;
    const snipMatch =
      block.match(
        /<(?:div|span)[^>]*(?:class=["'][^"']*(?:VwiC3b|aCOpRe|IsZvec)[^"']*["'])[^>]*>([\s\S]*?)<\/(?:div|span)>/i,
      ) || block.match(/<span[^>]*>([\s\S]{20,400}?)<\/span>/i);
    const snippet = snipMatch ? stripTags(snipMatch[1]!).slice(0, 320) : "";
    seen.add(url);
    out.push({ title, url, snippet });
  }

  if (out.length < limit) {
    // h3-in-anchor pattern without .g wrapper
    const h3Re =
      /<a[^>]+href=["']([^"']+)["'][^>]*>\s*<h3[^>]*>([\s\S]*?)<\/h3>/gi;
    while ((m = h3Re.exec(html)) !== null && out.length < limit) {
      const url = absUrl(m[1]!, "google");
      if (!url || seen.has(url)) continue;
      const title = stripTags(m[2]!).slice(0, 200);
      if (!title) continue;
      seen.add(url);
      out.push({ title, url, snippet: "" });
    }
  }

  if (out.length < limit) {
    pushAnchorFallback(html, "google", limit, out, seen);
  }
  return out.slice(0, limit);
}

function pushAnchorFallback(
  html: string,
  engine: WebSearchEngine,
  limit: number,
  out: WebSearchResult[],
  seen: Set<string>,
): void {
  const aRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = aRe.exec(html)) !== null && out.length < limit) {
    const url = absUrl(m[1]!, engine);
    if (!url || seen.has(url)) continue;
    const title = stripTags(m[2]!).slice(0, 200);
    if (title.length < 3) continue;
    // Skip nav chrome
    if (/^(images|news|videos|maps|shopping|all|web)$/i.test(title)) continue;
    seen.add(url);
    out.push({ title, url, snippet: "" });
  }
}

/** Compact text block for chat tool results. */
export function formatWebSearchResultsText(input: {
  query: string;
  engine: WebSearchEngine;
  results: readonly WebSearchResult[];
}): string {
  const lines = [
    `Web search (${input.engine}) for: ${input.query}`,
    "",
  ];
  if (input.results.length === 0) {
    lines.push(
      "(no results — start SearXNG with pnpm searxng:dev, or engine may have blocked scrape)",
    );
    return lines.join("\n");
  }
  input.results.forEach((r, i) => {
    lines.push(`${i + 1}. ${r.title}`);
    lines.push(`   ${r.url}`);
    if (r.snippet) lines.push(`   ${r.snippet}`);
    lines.push("");
  });
  return lines.join("\n").trimEnd();
}
