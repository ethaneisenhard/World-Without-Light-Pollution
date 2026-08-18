import type { ProjectConfig, ProjectNavEntry } from "./types.js";
import type { ProjectNavRoute } from "./types.js";

export type NavTreeItem = {
  id: string;
  label: string;
  path: string;
  kind?: string;
  /** Inherited from project.json nav entry — Live URL map. */
  route?: ProjectNavRoute;
  children?: NavTreeItem[];
};

/** Kinds that list direct files under their path in the Nav map. */
export const NAV_EXPAND_KINDS = new Set(["pages", "mdx-posts", "files"]);

/** Studio Nav content views (Website pages / blog). */
export const NAV_VIEW_KINDS = new Set(["pages", "mdx-posts"]);

/** Studio Nav Design section — Components tree + Design System leaf. */
export const NAV_DESIGN_KINDS = new Set(["components", "design-system"]);

const NAV_FILE_EXT = /\.(md|mdx|tsx|ts|jsx|js|css|json|jsonc|html|yml|yaml)$/i;
const COMPONENT_MANIFEST = /\/component\.ts$/i;

/**
 * Shared design-registry source root (repo-relative).
 * Nav `kind: components` expands from project paths **or** this package tree
 * (BrowserUI-style primitives/ / composites/ folders).
 */
export const SHARED_COMPONENT_SRC_ROOT = "packages/library/components/src";

function formatLabel(key: string): string {
  return key
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function joinPath(base: string, segment: string): string {
  if (!base) return segment.replace(/^\//, "");
  if (!segment) return base;
  return `${base.replace(/\/$/, "")}/${segment.replace(/^\//, "")}`;
}

/** Label for a file path leaf — `content/pages/home.md` → `Home`. */
export function filePathToNavLabel(filePath: string): string {
  const base = filePath.split("/").pop() ?? filePath;
  const stem = base.replace(/\.[^.]+$/, "");
  return formatLabel(stem);
}

/**
 * Page view title for Studio Nav — not filename / extension.
 * Prefer YAML `title:`, else first `#` heading, else stem label.
 */
export function extractPageNavTitle(source: string, filePath: string): string {
  const text = source.replace(/^\uFEFF/, "");
  if (text.startsWith("---")) {
    const end = text.indexOf("\n---", 3);
    if (end !== -1) {
      const fm = text.slice(3, end);
      const match = fm.match(/^title:\s*(.+)$/m);
      if (match?.[1]) {
        let title = match[1].trim();
        if (
          (title.startsWith('"') && title.endsWith('"')) ||
          (title.startsWith("'") && title.endsWith("'"))
        ) {
          title = title.slice(1, -1);
        }
        if (title) return title;
      }
    }
  }
  const heading = text.match(/^#\s+(.+)$/m);
  if (heading?.[1]?.trim()) return heading[1].trim();
  return filePathToNavLabel(filePath);
}

/** Apply resolved titles onto file leaves (mutates labels only). */
export function applyNavLeafTitles(
  items: readonly NavTreeItem[],
  titles: Readonly<Record<string, string>>,
): NavTreeItem[] {
  return items.map((item) => {
    const children = item.children
      ? applyNavLeafTitles(item.children, titles)
      : undefined;
    const isFile =
      item.kind === "file" ||
      item.kind === "component" ||
      item.kind === "design-system" ||
      isNavFilePath(item.path);
    if (isFile && titles[item.path]) {
      return { ...item, label: titles[item.path]!, children };
    }
    return { ...item, children };
  });
}

/**
 * Keep Website page views + Design (Components / Design System).
 * Drop App / Assets / raw `files` code sections.
 */
export function pruneNavToPageViews(
  items: readonly NavTreeItem[],
): NavTreeItem[] {
  const out: NavTreeItem[] = [];
  for (const item of items) {
    if (item.kind === "files") continue;

    if (item.kind === "components") {
      out.push({
        ...item,
        children: item.children?.length ? item.children : undefined,
      });
      continue;
    }

    if (item.kind === "design-system") {
      out.push(item);
      continue;
    }

    if (item.kind && NAV_VIEW_KINDS.has(item.kind)) {
      const fileKids = (item.children ?? []).filter(
        (c) => c.kind === "file" || isNavFilePath(c.path),
      );
      out.push({ ...item, children: fileKids.length ? fileKids : undefined });
      continue;
    }

    if (item.kind === "file" || item.kind === "component" || isNavFilePath(item.path)) {
      out.push(item);
      continue;
    }

    const kids = item.children ? pruneNavToPageViews(item.children) : [];
    if (kids.length > 0) {
      out.push({ ...item, children: kids });
    }
  }
  return out;
}

/** True when path looks like a file (has an extension on the last segment). */
export function isNavFilePath(path: string): boolean {
  const base = path.split("/").pop() ?? path;
  return NAV_FILE_EXT.test(base);
}

function entryToItem(id: string, entry: ProjectNavEntry | string, base: string): NavTreeItem {
  const labelKey = id.includes(".") ? id.slice(id.lastIndexOf(".") + 1) : id;
  if (typeof entry === "string") {
    return { id, label: formatLabel(labelKey), path: joinPath(base, entry) };
  }
  const path = joinPath(base, entry.path);
  const children = entry.children
    ? Object.entries(entry.children).map(([childId, child]) => {
        if (typeof child === "string") {
          return {
            id: `${id}.${childId}`,
            label: formatLabel(childId),
            path: joinPath(path, child),
          };
        }
        return entryToItem(`${id}.${childId}`, child as ProjectNavEntry, path);
      })
    : undefined;
  return {
    id,
    label: formatLabel(labelKey),
    path,
    kind: entry.kind,
    route: entry.route,
    children,
  };
}

/** Flatten nav tree paths for active-path resolution. */
export function collectNavPaths(items: readonly NavTreeItem[]): string[] {
  const out: string[] = [];
  for (const item of items) {
    out.push(item.path);
    if (item.children?.length) out.push(...collectNavPaths(item.children));
  }
  return out;
}

/**
 * File paths only (disk) — folders inferred by consumers that need file lists.
 */
export function collectNavFilePaths(items: readonly NavTreeItem[]): string[] {
  return collectNavPaths(items).filter(isNavFilePath);
}

export type NavPierreProjection = {
  /** Virtual label-paths for Pierre FileTree (Website/Pages/Home). */
  paths: string[];
  /** virtual → real project path */
  toRealPath: Record<string, string>;
  /** real → virtual (files + folders) */
  toVirtualPath: Record<string, string>;
};

/** Sanitize a nav label into a single path segment (Pierre display name). */
export function navLabelToPathSegment(label: string): string {
  const cleaned = label.replace(/[/\\]/g, "-").trim();
  return cleaned || "untitled";
}

/**
 * Project-map → Pierre paths: page titles as leaves (no file extensions).
 * Disk layout is not shown — maps back to real paths on select.
 *
 * Example: Website/Pages/Home → content/pages/home.md
 */
export function navTreeToPierreProjection(
  items: readonly NavTreeItem[],
): NavPierreProjection {
  const paths: string[] = [];
  const toRealPath: Record<string, string> = {};
  const toVirtualPath: Record<string, string> = {};

  function walk(nodes: readonly NavTreeItem[], labelPrefix: string[]): void {
    for (const item of nodes) {
      const segment = navLabelToPathSegment(item.label);
      const nextPrefix = [...labelPrefix, segment];
      const virtualFolder = nextPrefix.join("/");
      const isFile =
        item.kind === "file" ||
        item.kind === "component" ||
        item.kind === "design-system" ||
        (item.kind === "studio-panel" && !item.children?.length) ||
        isNavFilePath(item.path);

      if (isFile) {
        // Title only — no .md / .mdx / code extensions in the Nav tree.
        const virtualFile =
          labelPrefix.length > 0 ? [...labelPrefix, segment].join("/") : segment;
        paths.push(virtualFile);
        toRealPath[virtualFile] = item.path;
        toVirtualPath[item.path] = virtualFile;
        continue;
      }

      toRealPath[virtualFolder] = item.path;
      toVirtualPath[item.path] = virtualFolder;
      if (item.children?.length) {
        walk(item.children, nextPrefix);
      }
    }
  }

  walk(items, []);
  // Preserve nav declaration order (Settings/Analytics sections, panel groups).
  // Mount with preparePresortedFileTreeInput — Pierre's `presorted: true` still
  // validates default sort and rejects Website-before-Design declaration order.
  return {
    paths: [...new Set(paths)],
    toRealPath,
    toVirtualPath,
  };
}

/**
 * Deepest nav path that equals cwd or is an ancestor of cwd.
 * Only one path wins — parents are never active when a deeper match exists.
 */
export function resolveActiveNavPath(
  cwd: string,
  itemPaths: readonly string[],
): string | null {
  if (!cwd) return null;
  const normalized = cwd.replace(/^\/+|\/+$/g, "");
  if (!normalized) return null;
  let best: string | null = null;
  for (const raw of itemPaths) {
    const p = raw.replace(/^\/+|\/+$/g, "");
    if (!p) continue;
    if (normalized === p || normalized.startsWith(`${p}/`)) {
      if (best === null || p.length > best.length) best = p;
    }
  }
  return best;
}

/** True when itemPath is the single deepest nav match for cwd. */
export function isNavPathActive(
  cwd: string,
  itemPath: string,
  allItemPaths: readonly string[],
): boolean {
  const active = resolveActiveNavPath(cwd, allItemPaths);
  if (active === null) return false;
  const a = active.replace(/^\/+|\/+$/g, "");
  const b = itemPath.replace(/^\/+|\/+$/g, "");
  return a === b;
}

/** Default open: ancestors of cwd (and the cwd folder itself). */
export function isNavFolderOpenByDefault(
  folderPath: string,
  cwd: string,
): boolean {
  if (!cwd) return false;
  const folder = folderPath.replace(/^\/+|\/+$/g, "");
  const current = cwd.replace(/^\/+|\/+$/g, "");
  if (!folder) return false;
  return current === folder || current.startsWith(`${folder}/`);
}

/** Pure projection: project.json nav → sidebar tree */
export function projectNavToTree(config: Pick<ProjectConfig, "nav">): NavTreeItem[] {
  if (!config.nav) return [];
  return Object.entries(config.nav).map(([id, entry]) => entryToItem(id, entry, ""));
}

/**
 * Expand `components` kind into folder tree from component.ts modules.
 * (any depth under the nav folder). Folder layout is free-form
 * (primitives/, composites/, …).
 *
 * Also accepts shared package manifests under {@link SHARED_COMPONENT_SRC_ROOT}
 * so projects that re-export `@glassbox-studio/components` still get a BrowserUI-like
 * Components nav without duplicating sources under `design/components/`.
 */
export function expandNavFromComponentPaths(
  item: NavTreeItem,
  filePaths: readonly string[],
): NavTreeItem {
  const prefix = `${item.path.replace(/\/$/, "")}/`;
  const sharedPrefix = `${SHARED_COMPONENT_SRC_ROOT}/`;
  const manifests = filePaths
    .filter(
      (p) =>
        COMPONENT_MANIFEST.test(p) &&
        (p.startsWith(prefix) || p.startsWith(sharedPrefix)),
    )
    .sort((a, b) => a.localeCompare(b));

  type Node = { item: NavTreeItem; kids: Map<string, Node> };
  const root: Node = { item: { ...item, children: undefined }, kids: new Map() };

  for (const manifestPath of manifests) {
    const rel = manifestPath.startsWith(prefix)
      ? manifestPath.slice(prefix.length)
      : manifestPath.slice(sharedPrefix.length);
    const parts = rel.split("/");
    // …/section/component.ts → folders [section] leaf at section/
    if (parts.length < 2 || parts[parts.length - 1]!.toLowerCase() !== "component.ts") {
      continue;
    }
    const folderParts = parts.slice(0, -1);
    let cursor = root;
    let pathAcc = item.path;
    for (let i = 0; i < folderParts.length; i++) {
      const seg = folderParts[i]!;
      pathAcc = `${pathAcc}/${seg}`;
      const isLeaf = i === folderParts.length - 1;
      if (!cursor.kids.has(seg)) {
        cursor.kids.set(seg, {
          item: {
            id: `${item.id}:${pathAcc}`,
            label: formatLabel(seg),
            path: isLeaf ? manifestPath : pathAcc,
            kind: isLeaf ? "component" : undefined,
            route: item.route,
          },
          kids: new Map(),
        });
      } else if (isLeaf) {
        const existing = cursor.kids.get(seg)!;
        existing.item = {
          ...existing.item,
          path: manifestPath,
          kind: "component",
          route: item.route,
        };
      }
      cursor = cursor.kids.get(seg)!;
    }
  }

  function toTree(node: Node): NavTreeItem {
    if (node.kids.size === 0) return node.item;
    const children = [...node.kids.values()]
      .map(toTree)
      .sort((a, b) => a.label.localeCompare(b.label));
    return { ...node.item, children };
  }

  return toTree(root);
}

/** True when project.json nav declares a `kind: components` section. */
export function navConfigHasComponentsKind(
  nav: ProjectConfig["nav"] | undefined,
): boolean {
  if (!nav) return false;
  function walk(entries: Record<string, ProjectNavEntry | string>): boolean {
    for (const entry of Object.values(entries)) {
      if (typeof entry === "string") continue;
      if (entry.kind === "components") return true;
      if (entry.children && walk(entry.children)) return true;
    }
    return false;
  }
  return walk(nav);
}

/**
 * Prefix package-relative component.ts paths for Nav expand.
 * `primitives/section/component.ts` → `packages/library/components/src/primitives/…`
 */
export function toSharedComponentManifestPaths(
  relativeUnderSrc: readonly string[],
): string[] {
  const root = SHARED_COMPONENT_SRC_ROOT.replace(/\/$/, "");
  return relativeUnderSrc
    .filter((p) => COMPONENT_MANIFEST.test(`/${p.replace(/^\//, "")}`))
    .map((p) => `${root}/${p.replace(/^\//, "")}`);
}

/**
 * Expand `pages` / `mdx-posts` / `files` leaves with direct child files from the
 * project tree. `components` expands nested folders via component.ts modules.
 * Studio Nav mounts these paths in Pierre Trees (curated map);
 * Files panel uses the full disk tree separately.
 */
export function expandNavFromFilePaths(
  items: readonly NavTreeItem[],
  filePaths: readonly string[],
): NavTreeItem[] {
  return items.map((item) => {
    const nested = item.children
      ? expandNavFromFilePaths(item.children, filePaths)
      : undefined;

    if (item.kind === "components") {
      const expanded = expandNavFromComponentPaths(
        { ...item, children: nested },
        filePaths,
      );
      return expanded;
    }

    if (!item.kind || !NAV_EXPAND_KINDS.has(item.kind)) {
      return { ...item, children: nested };
    }

    const prefix = `${item.path}/`;
    const fileChildren: NavTreeItem[] = filePaths
      .filter((p) => p.startsWith(prefix))
      .filter((p) => {
        const rest = p.slice(prefix.length);
        return Boolean(rest) && !rest.includes("/");
      })
      .filter((p) => NAV_FILE_EXT.test(p))
      .sort((a, b) => a.localeCompare(b))
      .map((p) => ({
        id: `${item.id}:${p}`,
        label: filePathToNavLabel(p),
        path: p,
        kind: "file" as const,
        route: item.route,
      }));

    const existing = new Set((nested ?? []).map((c) => c.path));
    const merged = [
      ...(nested ?? []),
      ...fileChildren.filter((c) => !existing.has(c.path)),
    ];

    return {
      ...item,
      children: merged.length > 0 ? merged : nested,
    };
  });
}
