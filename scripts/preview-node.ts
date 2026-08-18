/**
 * Lite Node preview — no workerd (CONTEXT: minimal profile).
 * Serves site HTML via Worker fetch logic + disk ASSETS.
 *
 * - `__AS_PAGE_MD_READER` — content/*.md live on each request
 * - `tsx watch` (project.json) — restarts on src/design changes
 * - `/__as/hmr` SSE — iframe soft-reloads on content/ disk change (Studio
 *   writes only; does not postMessage from parent)
 */
import http from "node:http";
import { readFileSync, watch as fsWatch } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { ServerResponse } from "node:http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const publicDir = path.join(root, "public");
const contentPagesDir = path.join(root, "content/pages");
const port = Number(process.env.AS_PREVIEW_PORT || process.argv[2] || "9889");

(
  globalThis as { __AS_PAGE_MD_READER?: (slug: string) => string | undefined }
).__AS_PAGE_MD_READER = (slug: string) => {
  if (!/^[a-z0-9-]+$/i.test(slug)) return undefined;
  try {
    return readFileSync(path.join(contentPagesDir, `${slug}.md`), "utf8");
  } catch {
    return undefined;
  }
};

const workerMod = await import(
  pathToFileURL(path.join(root, "src/index.ts")).href
);
const worker = workerMod.default as {
  fetch: (
    req: Request,
    env: { ASSETS: { fetch: (r: Request) => Promise<Response> } },
  ) => Promise<Response>;
};

const MIME: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".html": "text/html; charset=utf-8",
  ".json": "application/json",
};

/**
 * Soft-apply stack (Idiomorph + soft-apply + HMR boot).
 * Morph keeps paint — no location.reload white flash.
 * SSE `error` must NOT call location.reload — that reload-stormed Live mid-edit.
 */
const bridgeDir = path.join(
  root,
  "../../packages/library/preview-bridge",
);
const hmrBootPath = path.join(bridgeDir, "as-preview-hmr-boot.js");
const idiomorphPath = path.join(bridgeDir, "vendor/idiomorph.min.js");
const softApplyPath = path.join(bridgeDir, "as-preview-soft-apply.js");

const HMR_BOOT_FALLBACK = `(function(){var p=null;function soft(r){if(p)return;p=setTimeout(function(){p=null;try{console.info("[as-preview-hmr] reload",r||"");location.reload()}catch(_){}},140)}window.addEventListener("message",function(ev){var d=ev&&ev.data;if(d&&d.type==="as:soft-reload")soft("postMessage")});function connect(){try{var es=new EventSource("/__as/hmr");es.onmessage=function(){soft("sse-message")};es.onerror=function(){try{es.close()}catch(_){}setTimeout(connect,2000)}}catch(e){setTimeout(connect,4000)}}connect()})();`;

function readBridgeScript(filePath: string, fallback = ""): string {
  try {
    return readFileSync(filePath, "utf8");
  } catch {
    return fallback;
  }
}

const HMR_BOOT = [
  `<script data-as-soft-apply>${readBridgeScript(idiomorphPath)}</script>`,
  `<script data-as-soft-apply>${readBridgeScript(softApplyPath)}</script>`,
  `<script data-as-preview-hmr>${readBridgeScript(hmrBootPath, HMR_BOOT_FALLBACK)}</script>`,
].join("\n");

function injectHmrBoot(html: string): string {
  if (html.includes("data-as-preview-hmr")) return html;
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${HMR_BOOT}</body>`);
  }
  return `${html}${HMR_BOOT}`;
}

async function assetsFetch(request: Request): Promise<Response> {
  const url = new URL(request.url);
  let rel = url.pathname.replace(/^\//, "");
  if (!rel || rel.endsWith("/")) rel = path.join(rel, "index.html");
  const filePath = path.join(publicDir, rel);
  if (!filePath.startsWith(publicDir)) {
    return new Response("Forbidden", { status: 403 });
  }
  try {
    await stat(filePath);
    const body = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    return new Response(body, {
      headers: { "Content-Type": MIME[ext] ?? "application/octet-stream" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

/** SSE clients — content disk changes broadcast here (idle queue on Studio side). */
const hmrClients = new Set<ServerResponse>();
let contentNotifyTimer: ReturnType<typeof setTimeout> | null = null;

function broadcastContentChange(reason: string): void {
  const payload = `data: ${JSON.stringify({ type: "content", reason })}\n\n`;
  for (const res of hmrClients) {
    try {
      res.write(payload);
    } catch {
      hmrClients.delete(res);
    }
  }
}

function scheduleContentNotify(reason: string): void {
  // Coalesce rapid saves — matches Studio idle-disk intent.
  if (contentNotifyTimer) clearTimeout(contentNotifyTimer);
  contentNotifyTimer = setTimeout(() => {
    contentNotifyTimer = null;
    console.log(`[preview-node] hmr ← ${reason}`);
    broadcastContentChange(reason);
  }, 120);
}

try {
  fsWatch(contentPagesDir, { recursive: true }, (_evt, filename) => {
    scheduleContentNotify(filename ? String(filename) : "content/pages");
  });
} catch (err) {
  console.warn("[preview-node] content watch failed", err);
}

const server = http.createServer(async (nodeReq, nodeRes) => {
  try {
    const reqUrl = new URL(
      `http://127.0.0.1:${port}${nodeReq.url ?? "/"}`,
    );

    if (reqUrl.pathname === "/__as/hmr") {
      nodeRes.writeHead(200, {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      });
      nodeRes.write(":connected\n\n");
      hmrClients.add(nodeRes);
      const beat = setInterval(() => {
        try {
          nodeRes.write(":ping\n\n");
        } catch {
          clearInterval(beat);
          hmrClients.delete(nodeRes);
        }
      }, 15000);
      nodeReq.on("close", () => {
        clearInterval(beat);
        hmrClients.delete(nodeRes);
      });
      return;
    }

    const headers = new Headers();
    for (const [k, v] of Object.entries(nodeReq.headers)) {
      if (v) headers.set(k, Array.isArray(v) ? v.join(", ") : v);
    }
    let body: Buffer | undefined;
    if (nodeReq.method !== "GET" && nodeReq.method !== "HEAD") {
      body = await new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        nodeReq.on("data", (c) => chunks.push(c));
        nodeReq.on("end", () => resolve(Buffer.concat(chunks)));
        nodeReq.on("error", reject);
      });
    }
    const request = new Request(reqUrl.href, {
      method: nodeReq.method,
      headers,
      body: body?.length ? new Uint8Array(body) : undefined,
    });
    const response = await worker.fetch(request, {
      ASSETS: { fetch: assetsFetch },
    });
    nodeRes.statusCode = response.status;
    const ct = response.headers.get("Content-Type") ?? "";
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "content-length") return;
      nodeRes.setHeader(key, value);
    });
    nodeRes.setHeader("Cache-Control", "no-store");

    const buf = Buffer.from(await response.arrayBuffer());
    if (ct.includes("text/html")) {
      const html = injectHmrBoot(buf.toString("utf8"));
      nodeRes.end(html);
      return;
    }
    nodeRes.end(buf);
  } catch (err) {
    nodeRes.statusCode = 500;
    nodeRes.setHeader("Content-Type", "text/plain");
    nodeRes.end(err instanceof Error ? err.message : "error");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(
    `[preview-node] glassbox-studio-template http://127.0.0.1:${port} (content watch → /__as/hmr)`,
  );
});
