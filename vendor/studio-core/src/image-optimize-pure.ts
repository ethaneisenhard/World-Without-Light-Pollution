/**
 * Image optimize URL / media-href helpers — pure (no sharp / I/O).
 *
 * MD authors use `media:<assetId>` (or full `/api/projects/…/media/…`).
 * Renderers rewrite to Studio API URLs with `?w=&fm=&q=` transform query.
 */

export type ImageFormat = "webp" | "avif" | "jpeg" | "png" | "original";

export type ImageTransformQuery = {
  width?: number;
  height?: number;
  format?: ImageFormat;
  quality?: number;
  /** Display width as % of prose measure (BrowserUI-shaped, 5–100). */
  percent?: number;
};

const MEDIA_SCHEME =
  /^media:(?:\/\/)?(?:([^/?#]+)\/)?([^/?#]+)(\?[^#]*)?(?:#.*)?$/i;
const PROJECT_MEDIA_PATH =
  /^\/api\/projects\/([^/]+)\/media\/([^/?#]+)(\?[^#]*)?(?:#.*)?$/i;
const STUDIO_MEDIA_PATH =
  /^\/api\/studio\/media\/([^/?#]+)(\?[^#]*)?(?:#.*)?$/i;

export const DEFAULT_IMAGE_WIDTHS = [480, 800, 1200, 1600] as const;
export const DEFAULT_IMAGE_QUALITY = 82;
export const DEFAULT_UPLOAD_MAX_EDGE = 2400;

export function parseImageTransformQuery(
  searchParams: URLSearchParams | Record<string, string | undefined>,
): ImageTransformQuery {
  const get = (key: string): string | undefined => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key) ?? undefined;
    }
    return searchParams[key];
  };
  const widthRaw = get("w") ?? get("width");
  const heightRaw = get("h") ?? get("height");
  const qualityRaw = get("q") ?? get("quality");
  const percentRaw = get("pct") ?? get("percent");
  const formatRaw = (get("fm") ?? get("format") ?? "").toLowerCase();
  const width = widthRaw ? Number(widthRaw) : undefined;
  const height = heightRaw ? Number(heightRaw) : undefined;
  const quality = qualityRaw ? Number(qualityRaw) : undefined;
  const percent = percentRaw ? Number(percentRaw) : undefined;
  const format = (
    ["webp", "avif", "jpeg", "png", "original"] as const
  ).includes(formatRaw as ImageFormat)
    ? (formatRaw as ImageFormat)
    : undefined;
  return {
    width:
      width && Number.isFinite(width) && width > 0
        ? Math.min(Math.floor(width), 4096)
        : undefined,
    height:
      height && Number.isFinite(height) && height > 0
        ? Math.min(Math.floor(height), 4096)
        : undefined,
    quality:
      quality && Number.isFinite(quality) && quality > 0
        ? Math.min(Math.floor(quality), 100)
        : undefined,
    percent:
      percent && Number.isFinite(percent) && percent > 0
        ? Math.min(Math.max(Math.round(percent), 5), 100)
        : undefined,
    format,
  };
}

export function imageTransformHasWork(q: ImageTransformQuery): boolean {
  return Boolean(
    q.width ||
      q.height ||
      q.percent ||
      (q.format && q.format !== "original") ||
      q.quality,
  );
}

export function appendImageTransformQuery(
  url: string,
  transform: ImageTransformQuery,
): string {
  const u = new URL(url, "http://as.local");
  if (transform.width) u.searchParams.set("w", String(transform.width));
  if (transform.height) u.searchParams.set("h", String(transform.height));
  if (transform.percent) u.searchParams.set("pct", String(transform.percent));
  if (transform.format && transform.format !== "original") {
    u.searchParams.set("fm", transform.format);
  }
  if (transform.quality) u.searchParams.set("q", String(transform.quality));
  const qs = u.searchParams.toString();
  const path = u.pathname + (qs ? `?${qs}` : "");
  if (/^https?:\/\//i.test(url)) {
    return `${u.origin}${path}`;
  }
  return path;
}

export type ParsedMediaHref =
  | {
      kind: "project";
      projectId: string;
      assetId: string;
      transform?: ImageTransformQuery;
    }
  | {
      kind: "studio";
      assetId: string;
      transform?: ImageTransformQuery;
    }
  | {
      kind: "media-ref";
      assetId: string;
      projectId?: string;
      transform?: ImageTransformQuery;
    }
  | null;

function transformFromQuerySuffix(query: string | undefined): ImageTransformQuery | undefined {
  if (!query || query === "?") return undefined;
  const q = query.startsWith("?") ? query.slice(1) : query;
  const parsed = parseImageTransformQuery(new URLSearchParams(q));
  return imageTransformHasWork(parsed) ? parsed : undefined;
}

/** Parse `media:id`, `media:id?w=480`, `media://project/id`, or Studio media API paths. */
export function parseMediaHref(href: string): ParsedMediaHref {
  const raw = href.trim();
  if (!raw) return null;
  const scheme = raw.match(MEDIA_SCHEME);
  if (scheme) {
    const projectId = scheme[1]?.trim();
    const assetId = scheme[2]?.trim();
    if (!assetId) return null;
    const transform = transformFromQuerySuffix(scheme[3]);
    return projectId
      ? { kind: "media-ref", projectId, assetId, transform }
      : { kind: "media-ref", assetId, transform };
  }
  try {
    const u = raw.startsWith("http") ? new URL(raw) : null;
    const path = u ? u.pathname + u.search : raw;
    const project = path.match(PROJECT_MEDIA_PATH);
    if (project) {
      return {
        kind: "project",
        projectId: decodeURIComponent(project[1]!),
        assetId: decodeURIComponent(project[2]!),
        transform: transformFromQuerySuffix(project[3] ?? u?.search),
      };
    }
    const studio = path.match(STUDIO_MEDIA_PATH);
    if (studio) {
      return {
        kind: "studio",
        assetId: decodeURIComponent(studio[1]!),
        transform: transformFromQuerySuffix(studio[2] ?? u?.search),
      };
    }
  } catch {
    return null;
  }
  return null;
}

function mediaHrefBase(parsed: NonNullable<ParsedMediaHref>): string {
  if (parsed.kind === "studio") return `media:${parsed.assetId}`;
  if (parsed.kind === "project") {
    return `media://${parsed.projectId}/${parsed.assetId}`;
  }
  return parsed.projectId
    ? `media://${parsed.projectId}/${parsed.assetId}`
    : `media:${parsed.assetId}`;
}

/** Set or clear pixel `w=` on a media href (legacy). Prefer `mediaHrefWithPercent`. */
export function mediaHrefWithWidth(href: string, width: number | null): string {
  const parsed = parseMediaHref(href);
  if (!parsed) {
    if (width == null || width <= 0) return href;
    try {
      const u = new URL(href, "http://as.local");
      u.searchParams.set("w", String(Math.round(width)));
      if (/^https?:\/\//i.test(href)) return u.toString();
      return u.pathname + u.search;
    } catch {
      return href;
    }
  }
  const base = mediaHrefBase(parsed);
  if (width == null || width <= 0) return base;
  return `${base}?w=${Math.round(width)}`;
}

/**
 * BrowserUI-shaped resize — store display width as `pct=` (5–100) on media href.
 * Sharp fetch width is derived at resolve time from percent × measure.
 */
export function mediaHrefWithPercent(
  href: string,
  percent: number | null,
): string {
  const parsed = parseMediaHref(href);
  const pct =
    percent == null || percent <= 0
      ? null
      : Math.min(Math.max(Math.round(percent), 5), 100);
  if (!parsed) {
    if (pct == null) return href;
    try {
      const u = new URL(href, "http://as.local");
      u.searchParams.set("pct", String(pct));
      u.searchParams.delete("w");
      if (/^https?:\/\//i.test(href)) return u.toString();
      return u.pathname + u.search;
    } catch {
      return href;
    }
  }
  const base = mediaHrefBase(parsed);
  if (pct == null) return base;
  return `${base}?pct=${pct}`;
}

export function mediaHrefDisplayWidth(href: string): number | undefined {
  return parseMediaHref(href)?.transform?.width;
}

export function mediaHrefDisplayPercent(href: string): number | undefined {
  return parseMediaHref(href)?.transform?.percent;
}

/** Pixel width for sharp when only `pct` is set (BrowserUI measure ≈ 720–1200). */
export function pixelWidthFromPercent(
  percent: number,
  measurePx = 1200,
): number {
  const pct = Math.min(Math.max(percent, 5), 100);
  return Math.max(80, Math.round((pct / 100) * measurePx));
}

export function mediaMarkdownHref(
  assetId: string,
  projectId?: string,
): string {
  return projectId ? `media://${projectId}/${assetId}` : `media:${assetId}`;
}

export type ResolveMediaHrefOpts = {
  /** Absolute Studio API origin, e.g. http://127.0.0.1:3847 — required for Live iframes */
  apiOrigin?: string;
  defaultProjectId?: string;
  transform?: ImageTransformQuery;
};

/**
 * Browser-reachable Studio API origin for Live `<img src>`.
 * Cloud desk previews must not emit `http://127.0.0.1:3847` — the iframe
 * runs on a public preview host; localhost is the Host machine, not the browser.
 *
 * Ladder (first non-empty wins):
 * `STUDIO_API_URL` → `AS_STUDIO_API_ORIGIN` → `APP_ORIGIN` → `STUDIO_API_PROXY` → local default.
 */
export function resolveStudioMediaApiOrigin(
  env: Record<string, string | undefined> = {},
): string {
  const keys = [
    "STUDIO_API_URL",
    "AS_STUDIO_API_ORIGIN",
    "APP_ORIGIN",
    "STUDIO_API_PROXY",
  ] as const;
  for (const key of keys) {
    const trimmed = String(env[key] ?? "")
      .trim()
      .replace(/\/$/, "");
    if (trimmed) return trimmed;
  }
  return "http://127.0.0.1:3847";
}

/**
 * Env for spawned project Live servers — pin media API origin so draft HTML
 * embeds a public URL even when the child only inherits a partial env.
 */
export function projectLiveMediaApiChildEnv(
  parentEnv: Record<string, string | undefined>,
): Record<string, string | undefined> {
  const origin = resolveStudioMediaApiOrigin(parentEnv);
  if (origin === "http://127.0.0.1:3847" && !parentEnv.AS_STUDIO_API_ORIGIN) {
    return { ...parentEnv };
  }
  return {
    ...parentEnv,
    AS_STUDIO_API_ORIGIN: origin,
  };
}

/** Resolve markdown image href → fetchable URL (relative or absolute). */
export function resolveMediaImageUrl(
  href: string,
  opts: ResolveMediaHrefOpts = {},
): string {
  const parsed = parseMediaHref(href);
  let path: string;
  if (!parsed) {
    path = href;
  } else if (parsed.kind === "studio") {
    path = `/api/studio/media/${encodeURIComponent(parsed.assetId)}`;
  } else {
    const projectId =
      parsed.kind === "project"
        ? parsed.projectId
        : parsed.projectId ?? opts.defaultProjectId ?? "";
    path = `/api/projects/${encodeURIComponent(projectId)}/media/${encodeURIComponent(parsed.assetId)}`;
  }
  const merged: ImageTransformQuery = {
    ...parsed?.transform,
    ...opts.transform,
  };
  // Fetch bytes: prefer explicit w=, else derive from pct= (don't send pct to API).
  const fetchTransform: ImageTransformQuery = {
    format: merged.format,
    quality: merged.quality,
    height: merged.height,
    width:
      merged.width ??
      (merged.percent ? pixelWidthFromPercent(merged.percent) : undefined),
  };
  const withQs = imageTransformHasWork(fetchTransform)
    ? appendImageTransformQuery(path.split("?")[0]!, fetchTransform)
    : path.split("?")[0]!;
  const origin = opts.apiOrigin?.replace(/\/$/, "");
  if (origin && withQs.startsWith("/")) return `${origin}${withQs}`;
  return withQs;
}

export function buildOptimizedSrcSet(
  href: string,
  opts: ResolveMediaHrefOpts & {
    widths?: readonly number[];
    format?: ImageFormat;
    quality?: number;
  } = {},
): string {
  const widths = opts.widths ?? DEFAULT_IMAGE_WIDTHS;
  const format = opts.format ?? "webp";
  const quality = opts.quality ?? DEFAULT_IMAGE_QUALITY;
  return widths
    .map((w) => {
      const url = resolveMediaImageUrl(href, {
        ...opts,
        transform: { width: w, format, quality },
      });
      return `${url} ${w}w`;
    })
    .join(", ");
}

export function shouldOptimizeUploadContentType(contentType: string): boolean {
  const ct = contentType.toLowerCase();
  if (!ct.startsWith("image/")) return false;
  // Keep SVG + animated GIF as-is.
  if (ct === "image/svg+xml" || ct === "image/gif") return false;
  return true;
}

export function replaceFilenameExtension(
  filename: string,
  ext: string,
): string {
  const clean = ext.replace(/^\./, "");
  const base = filename.replace(/\.[^.]+$/, "");
  return `${base || "image"}.${clean}`;
}
