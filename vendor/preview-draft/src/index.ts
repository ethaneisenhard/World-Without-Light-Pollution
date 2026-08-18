/**
 * Live draft override — in-memory content for true-site preview (no wrangler rebuild).
 *
 * HMR path (Vite-like): PUT /__as/draft with Accept: text/html → Worker stores
 * draft AND returns rendered HTML in the same response. Bridge swaps DOM from
 * that payload — no second page fetch.
 */

/** Normalize content paths for Map keys. */
export function normalizeDraftPath(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/^\/+/, "");
}

export type PreviewDraftStore = {
  get(path: string): string | undefined;
  set(path: string, content: string): void;
  clear(path?: string): void;
  has(path: string): boolean;
  size(): number;
};

/** Injectable in-memory draft map (one per Worker isolate). */
export function createPreviewDraftStore(
  initial?: Iterable<[string, string]>,
): PreviewDraftStore {
  const map = new Map<string, string>();
  if (initial) {
    for (const [path, content] of initial) {
      map.set(normalizeDraftPath(path), content);
    }
  }
  return {
    get(path) {
      return map.get(normalizeDraftPath(path));
    },
    set(path, content) {
      map.set(normalizeDraftPath(path), content);
    },
    clear(path) {
      if (path === undefined) map.clear();
      else map.delete(normalizeDraftPath(path));
    },
    has(path) {
      return map.has(normalizeDraftPath(path));
    },
    size() {
      return map.size;
    },
  };
}

/** HTTP mount path for draft API (same-origin from iframe bridge). */
export const PREVIEW_DRAFT_HTTP_PATH = "/__as/draft";

export type PreviewDraftBody = {
  path: string;
  content: string;
};

export function isPreviewDraftBody(data: unknown): data is PreviewDraftBody {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return typeof d.path === "string" && typeof d.content === "string";
}

export type PreviewDraftRenderHtml = (input: {
  path: string;
  content: string;
  request: Request;
}) => string | null | Promise<string | null>;

export type PreviewDraftOrchestratorDeps = {
  store: PreviewDraftStore;
  /** When client asks for HTML (HMR), return full page after store update. */
  renderHtml?: PreviewDraftRenderHtml;
};

function wantsRenderedHtml(request: Request): boolean {
  if (request.headers.get("X-AS-HMR") === "1") return true;
  const accept = request.headers.get("Accept") ?? "";
  return accept.includes("text/html");
}

/**
 * Orchestrator: handle PUT/DELETE/GET /__as/draft.
 * Returns null when the request is not the draft API (caller continues routing).
 */
export async function handlePreviewDraftRequestOrchestrator(
  deps: PreviewDraftOrchestratorDeps,
  request: Request,
): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== PREVIEW_DRAFT_HTTP_PATH) return null;

  if (request.method === "PUT") {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "invalid json" }, { status: 400 });
    }
    if (!isPreviewDraftBody(body) || !body.path.trim()) {
      return Response.json({ error: "path and content required" }, { status: 400 });
    }
    deps.store.set(body.path, body.content);

    if (wantsRenderedHtml(request) && deps.renderHtml) {
      const html = await deps.renderHtml({
        path: body.path,
        content: body.content,
        request,
      });
      if (html) {
        return new Response(html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "X-AS-HMR": "1",
            "Cache-Control": "no-store",
          },
        });
      }
    }

    return Response.json({
      ok: true,
      path: normalizeDraftPath(body.path),
      size: deps.store.size(),
    });
  }

  if (request.method === "DELETE") {
    const path = url.searchParams.get("path");
    if (path) deps.store.clear(path);
    else deps.store.clear();

    if (wantsRenderedHtml(request) && deps.renderHtml) {
      const html = await deps.renderHtml({
        path: path ?? "",
        content: "",
        request,
      });
      if (html) {
        return new Response(html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "X-AS-HMR": "1",
            "Cache-Control": "no-store",
          },
        });
      }
    }

    return Response.json({ ok: true, size: deps.store.size() });
  }

  if (request.method === "GET") {
    const path = url.searchParams.get("path");
    if (!path) {
      return Response.json({ size: deps.store.size() });
    }
    const content = deps.store.get(path);
    if (content === undefined) {
      return Response.json({ error: "not found" }, { status: 404 });
    }
    return Response.json({ path: normalizeDraftPath(path), content });
  }

  return new Response("Method Not Allowed", { status: 405 });
}

/**
 * Plug-in helper: content file under `dirPrefix` with `ext` → slug.
 * Example: content/blog/hello-world.mdx → hello-world
 */
export function slugFromContentPath(
  filePath: string,
  dirPrefix: string,
  ext: string,
): string | null {
  const normalized = normalizeDraftPath(filePath);
  const prefix = normalizeDraftPath(dirPrefix).replace(/\/?$/, "/");
  const suffix = ext.startsWith(".") ? ext : `.${ext}`;
  if (!normalized.startsWith(prefix) || !normalized.endsWith(suffix)) return null;
  const rest = normalized.slice(prefix.length, normalized.length - suffix.length);
  if (!rest || rest.includes("/")) return null;
  return rest;
}

export function contentPathForSlug(
  dirPrefix: string,
  slug: string,
  ext: string,
): string {
  const prefix = normalizeDraftPath(dirPrefix).replace(/\/?$/, "");
  const suffix = ext.startsWith(".") ? ext : `.${ext}`;
  return `${prefix}/${slug}${suffix}`;
}

/** Page URL for HMR render — bridge sends X-AS-HMR-URL. */
export function hmrPageUrlFromRequest(request: Request): string | null {
  const explicit = request.headers.get("X-AS-HMR-URL");
  if (explicit) return explicit;
  const referer = request.headers.get("Referer");
  return referer || null;
}
