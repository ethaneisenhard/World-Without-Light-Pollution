/** Design Studio paths — component manifests + design-system tokens + home. */

import type { NavTreeItem } from "./nav-pure.js";
import { resolveNavFilePreviewPath } from "./nav-routes-pure.js";

/** True when Nav/Files selection should open Design window (not Live site). */
export function isDesignStudioPath(filePath: string): boolean {
  const p = filePath.replace(/^\/+|\/+$/g, "");
  if (!p) return false;
  if (/\/component\.ts$/i.test(p)) return true;
  if (/(^|\/)design-system\.json$/i.test(p)) return true;
  return false;
}

/**
 * Shared registry manifests live under the monorepo `packages/library/components`
 * tree — outside any one project root. Studio opens Design for these; Code
 * may read via repo-relative API.
 */
export function isSharedComponentManifestPath(filePath: string): boolean {
  const p = filePath.replace(/^\/+|\/+$/g, "");
  return (
    p.startsWith("packages/library/components/") && /\/component\.ts$/i.test(p)
  );
}

/** True when a site path is under the Design canvas (`/__as/design…`). */
export function isDesignSitePath(sitePath: string): boolean {
  const p = sitePath.trim();
  return /^\/__as\/design(\/|$|\?)/.test(p);
}

/**
 * Live iframe / Open site — never Design Studio (`/__as/design…`).
 * When selection maps to a design route, keep `fallback` (last site page or `/`).
 */
export function resolveLiveSitePreviewPath(
  filePath: string,
  items: readonly NavTreeItem[],
  fallback = "/",
): string {
  const resolved = resolveNavFilePreviewPath(filePath, items);
  if (resolved && !isDesignSitePath(resolved)) {
    return resolved.startsWith("/") ? resolved : `/${resolved}`;
  }
  const fb = fallback.trim() || "/";
  return fb.startsWith("/") ? fb : `/${fb}`;
}

function normalizeSitePath(path: string): string {
  const t = path.trim();
  if (!t) return "/";
  return t.startsWith("/") ? t : `/${t}`;
}

/**
 * Design section home URL from nav — prefers parent `route.indexUrl`
 * when the section owns components / design-system children.
 * Falls back to `/__as/design` when a design section exists without indexUrl.
 */
export function resolveDesignHomeUrl(
  items: readonly NavTreeItem[],
): string | null {
  let found = false;
  let indexUrl: string | null = null;

  function walk(nodes: readonly NavTreeItem[]): void {
    for (const item of nodes) {
      const kids = item.children ?? [];
      const hasDesignKids = kids.some(
        (k) => k.kind === "design-system" || k.kind === "components",
      );
      if (hasDesignKids) {
        found = true;
        if (item.route?.indexUrl) {
          indexUrl = normalizeSitePath(item.route.indexUrl);
        }
      }
      if (kids.length) walk(kids);
    }
  }

  walk(items);
  if (!found) return null;
  return indexUrl ?? "/__as/design";
}

/**
 * Design site path for an explicit Design nav selection (file or folder).
 * Does not fall back to home — null when selection is outside Design.
 */
export function resolveDesignSelectionSitePath(
  fileOrDir: string,
  items: readonly NavTreeItem[],
): string | null {
  const path = fileOrDir.replace(/^\/+|\/+$/g, "");
  if (!path) return null;
  if (isDesignStudioPath(path)) {
    return resolveNavFilePreviewPath(path, items);
  }
  const preview = resolveNavFilePreviewPath(path, items);
  if (preview && isDesignSitePath(preview)) return preview;
  return null;
}

/**
 * Resolve Design iframe site path from selection.
 * Design files/folders → their nav route; otherwise → design home.
 */
export function resolveDesignCanvasSitePath(
  fileOrDir: string,
  items: readonly NavTreeItem[],
): string | null {
  return (
    resolveDesignSelectionSitePath(fileOrDir, items) ??
    resolveDesignHomeUrl(items)
  );
}
