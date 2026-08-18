import type { ProjectNavRoute } from "./types.js";
import type { NavTreeItem } from "./nav-pure.js";
import { isNavFilePath } from "./nav-pure.js";

/** File stem — `content/pages/about.md` → `about`. */
export function filePathStem(filePath: string): string {
  const base = filePath.split("/").pop() ?? filePath;
  return base.replace(/\.[^.]+$/, "");
}

/**
 * Apply a nav route map to a file stem → site pathname.
 * Pure + config-driven — works for any project that declares `route` on nav.
 */
export function applyNavRoutePattern(
  route: ProjectNavRoute,
  slug: string,
): string {
  const indexStem = route.index ?? "home";
  const indexUrl = route.indexUrl ?? "/";
  if (slug === indexStem) {
    return indexUrl.startsWith("/") ? indexUrl : `/${indexUrl}`;
  }
  const filled = route.pattern.replace(/:slug/g, slug);
  if (!filled.startsWith("/")) return `/${filled}`;
  return filled.replace(/\/{2,}/g, "/") || "/";
}

/** Find deepest nav item whose path equals or owns `filePath`. */
export function findNavItemForPath(
  items: readonly NavTreeItem[],
  filePath: string,
): NavTreeItem | null {
  const normalized = filePath.replace(/^\/+|\/+$/g, "");
  if (!normalized) return null;
  let best: NavTreeItem | null = null;
  function walk(nodes: readonly NavTreeItem[]): void {
    for (const item of nodes) {
      const p = item.path.replace(/^\/+|\/+$/g, "");
      if (!p) continue;
      if (normalized === p || normalized.startsWith(`${p}/`)) {
        if (!best || p.length >= best.path.length) best = item;
      }
      if (item.children?.length) walk(item.children);
    }
  }
  walk(items);
  return best;
}

/**
 * Resolve a content file (or folder under a routed section) → Live site path.
 * Returns null when no `route` map applies (caller keeps current preview URL).
 *
 * Design components: `…/blog-hero/component.ts` → route slug `blog-hero`.
 * Design system: `design/design-system.json` → route indexUrl.
 */
export function resolveNavFilePreviewPath(
  filePath: string,
  items: readonly NavTreeItem[],
): string | null {
  if (!filePath) return null;
  const item = findNavItemForPath(items, filePath);
  if (!item) return null;

  // Prefer route on the file leaf or nearest ancestor with route.
  let route = item.route;
  if (!route) {
    const owner = findRoutedAncestor(items, filePath);
    route = owner?.route;
  }
  if (!route) return null;

  const normalized = filePath.replace(/^\/+|\/+$/g, "");
  if (
    item.kind === "design-system" ||
    /(^|\/)design-system\.json$/i.test(normalized)
  ) {
    return route.indexUrl ?? applyNavRoutePattern(route, "system");
  }

  if (item.kind === "component" || /\/component\.ts$/i.test(normalized)) {
    const folder = normalized.replace(/\/component\.ts$/i, "");
    const slug = folder.split("/").pop() ?? filePathStem(normalized);
    return applyNavRoutePattern(route, slug);
  }

  if (isNavFilePath(filePath) || item.kind === "file") {
    return applyNavRoutePattern(route, filePathStem(filePath));
  }
  // Folder select under a routed section → index page
  return route.indexUrl ?? "/";
}

function findRoutedAncestor(
  items: readonly NavTreeItem[],
  filePath: string,
): NavTreeItem | null {
  const normalized = filePath.replace(/^\/+|\/+$/g, "");
  let best: NavTreeItem | null = null;
  function walk(nodes: readonly NavTreeItem[]): void {
    for (const item of nodes) {
      const p = item.path.replace(/^\/+|\/+$/g, "");
      if (!p || !item.route) continue;
      if (normalized === p || normalized.startsWith(`${p}/`)) {
        if (!best || p.length >= best.path.length) best = item;
      }
      if (item.children?.length) walk(item.children);
    }
  }
  walk(items);
  return best;
}

/**
 * Reverse of resolveNavFilePreviewPath — find a Nav file/folder for a site path.
 * Used when Design iframe posts sitePath without an explicit navPath.
 */
export function findNavPathForSitePath(
  sitePath: string,
  items: readonly NavTreeItem[],
): string | null {
  const target = sitePath.trim().replace(/\/+$/, "") || "/";
  let best: { path: string; len: number } | null = null;

  function walk(nodes: readonly NavTreeItem[]): void {
    for (const item of nodes) {
      const resolved = resolveNavFilePreviewPath(item.path, items);
      if (resolved) {
        const norm = resolved.replace(/\/+$/, "") || "/";
        if (norm === target || target.startsWith(`${norm}/`)) {
          if (!best || item.path.length >= best.len) {
            best = { path: item.path, len: item.path.length };
          }
        }
      }
      if (item.children?.length) walk(item.children);
    }
  }

  walk(items);
  return best?.path ?? null;
}

/** Join hosting.prod_url + site path for iframe src. */
export function joinPreviewUrl(baseUrl: string, sitePath: string): string {
  const base = baseUrl.trim().replace(/\/$/, "");
  if (!base) return "";
  let path = sitePath.trim() || "/";
  if (!path.startsWith("/")) path = `/${path}`;
  if (path === "/") return `${base}/`;
  return `${base}${path}`;
}
