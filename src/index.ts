import { tryHandleStarterAnalytics } from "./analytics/events-handler.js";
import {
  createPreviewDraftStore,
  handlePreviewDraftRequestOrchestrator,
  hmrPageUrlFromRequest,
} from "@glassbox-studio/preview-draft";
import { parseAsThemeParam } from "@glassbox-studio/studio-core/browser";
import {
  renderDesignApiPayload,
  renderDesignComponentPreview,
  renderDesignComponentsIndex,
  renderDesignHome,
  renderDesignSystemAtlas,
} from "./design/preview.js";
import { renderIntegrationsDemoPage } from "./integrations/preview.js";
import type { DesignInspectorDraft } from "./design/draft-pure.js";
import {
  designSandboxRegistry,
} from "./design/registry.js";
import { matchSitePage } from "./site-pure.js";
import { renderSitePage } from "./render-html.js";
import { isDevSiteHost } from "./canvas-inspector-config-pure.js";
import { tryHandleStarterAuth } from "./auth/starter-auth-host.js";
import type { D1DatabaseLike } from "@glassbox-studio/auth";

export interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  SESSION_SECRET?: string;
  APP_ORIGIN?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  AS_STARTER_PASSWORD?: string;
  DB?: D1DatabaseLike;
}

const draftStore = createPreviewDraftStore();

function themeFromUrl(url: URL) {
  return parseAsThemeParam(url.searchParams.get("as-theme")) ?? "dark";
}

function renderFromRequest(request: Request): string | null {
  const pageUrl = hmrPageUrlFromRequest(request);
  if (!pageUrl) return null;
  let pathname: string;
  let search = "";
  try {
    const u = new URL(pageUrl);
    pathname = u.pathname;
    search = u.search;
  } catch {
    return null;
  }
  const page = matchSitePage(pathname);
  if (!page) return null;
  const theme =
    parseAsThemeParam(new URLSearchParams(search).get("as-theme")) ?? "light";
  const studioPreview =
    new URLSearchParams(search).get("as-preview") === "1";
  let hostname = "127.0.0.1";
  try {
    hostname = new URL(pageUrl).hostname;
  } catch {
    /* keep default */
  }
  return renderSitePage(page, {
    getDraft: (path) => draftStore.get(path),
    theme,
    studioPreview,
    devSite: isDevSiteHost(hostname),
  });
}

function corsJson(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json; charset=utf-8");
  }
  // Studio Live (:4400) fetches inspector meta from project origin (:8789)
  headers.set("Access-Control-Allow-Origin", "*");
  return new Response(JSON.stringify(data), { ...init, headers });
}

async function matchDesignRequest(
  request: Request,
  url: URL,
): Promise<Response | null> {
  const colorMode = themeFromUrl(url);

  if (url.pathname === "/__as/design" || url.pathname === "/__as/design/") {
    return new Response(renderDesignHome(colorMode), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  if (
    url.pathname === "/__as/integrations" ||
    url.pathname === "/__as/integrations/"
  ) {
    return new Response(renderIntegrationsDemoPage(colorMode), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  if (url.pathname === "/__as/design/system") {
    return new Response(renderDesignSystemAtlas(colorMode), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  if (url.pathname === "/__as/design/components") {
    return new Response(renderDesignComponentsIndex(colorMode), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const bootMatch = url.pathname.match(
    /^\/__as\/design\/components\/([^/]+)\/inspector\.json\/?$/,
  );
  if (bootMatch?.[1] && request.method === "GET") {
    const boot = designSandboxRegistry.inspectorBootstrap(bootMatch[1]);
    if (!boot) return corsJson({ error: "not found" }, { status: 404 });
    return corsJson(boot);
  }

  const canvasRender = url.pathname.match(
    /^\/__as\/canvas-inspector\/([^/]+)\/render\/?$/,
  );
  if (canvasRender?.[1] && request.method === "POST") {
    let body: {
      draft?: DesignInspectorDraft;
      instanceId?: string;
    } = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return Response.json({ error: "invalid json" }, { status: 400 });
    }
    const draft = body.draft ?? { props: {}, slotText: {}, children: "" };
    let html =
      designSandboxRegistry.renderWithDraft(canvasRender[1], draft) ?? null;
    if (!html) return Response.json({ error: "not found" }, { status: 404 });
    if (body.instanceId) {
      const safeId = body.instanceId.replace(/"/g, "");
      if (html.includes("data-as-component=")) {
        html = html.replace(
          /data-as-component="([^"]+)"/,
          `data-as-inspect="1" data-as-kind="component" data-as-component="$1" data-as-instance="${safeId}"`,
        );
      }
    }
    return Response.json({ html });
  }

  const renderMatch = url.pathname.match(
    /^\/__as\/design\/components\/([^/]+)\/render\/?$/,
  );
  if (renderMatch?.[1] && request.method === "POST") {
    let body: { mode?: string; draft?: DesignInspectorDraft } = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return Response.json({ error: "invalid json" }, { status: 400 });
    }
    const mode =
      body.mode === "permutations" ? "permutations" : "sandbox";
    const payload = renderDesignApiPayload(
      renderMatch[1],
      mode,
      body.draft ?? { props: {}, slotText: {}, children: "" },
    );
    if (!payload) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json(payload);
  }

  const m = url.pathname.match(/^\/__as\/design\/components\/([^/]+)\/?$/);
  if (!m?.[1]) return null;
  const mode =
    url.searchParams.get("mode") === "permutations"
      ? "permutations"
      : "sandbox";
  const html = renderDesignComponentPreview(m[1], mode, colorMode);
  if (!html) return new Response("Not found", { status: 404 });
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const draftRes = await handlePreviewDraftRequestOrchestrator(
      {
        store: draftStore,
        renderHtml: async ({ request: req }) => renderFromRequest(req),
      },
      request,
    );
    if (draftRes) return draftRes;

    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({
        ok: true,
        service: "world-against-light-pollution",
        drafts: draftStore.size(),
      });
    }

    const authRes = await tryHandleStarterAuth(request, env);
    if (authRes) return authRes;

    const analyticsRes = await tryHandleStarterAnalytics(request, url);
    if (analyticsRes) return analyticsRes;

    if (
      url.pathname.startsWith("/styles.css") ||
      url.pathname.startsWith("/assets/") ||
      url.pathname === "/as-hmr-bridge.js" ||
      url.pathname === "/as-canvas-inspector.js" ||
      url.pathname === "/design-inspector.js" ||
      url.pathname === "/design-system-edit.js" ||
      url.pathname === "/integrations-client.js" ||
      url.pathname === "/analytics-client.js"
    ) {
      return env.ASSETS.fetch(request);
    }

    const designRes = await matchDesignRequest(request, url);
    if (designRes) return designRes;

    const page = matchSitePage(url.pathname);
    if (!page) {
      return new Response("Not found", { status: 404 });
    }

    const theme = parseAsThemeParam(url.searchParams.get("as-theme")) ?? "light";
    const studioPreview = url.searchParams.get("as-preview") === "1";
    return new Response(
      renderSitePage(page, {
        getDraft: (path) => draftStore.get(path),
        theme,
        studioPreview,
        devSite: isDevSiteHost(url.hostname),
      }),
      {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    );
  },
};
