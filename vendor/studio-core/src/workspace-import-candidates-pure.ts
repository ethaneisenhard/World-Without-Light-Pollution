/**
 * Discover folders under a scan root as workspace import candidates.
 * Settings UI defaults to the computer disk root (`/`); CLI `--root .` stays
 * the Studio folder.
 */

import { slugifyPlanningWorkspaceName } from "./planning-workspace-pure.js";
import type { ProjectRegistry } from "./types.js";
import { isWorkspaceProtectedId } from "./workspace-registry-pure.js";
export { isWorkspaceProtectedId } from "./workspace-registry-pure.js";

/** Disk root — Settings import browser starts here (Hermes-style). */
export const DEFAULT_WORKSPACE_IMPORT_SCAN_ROOT = "/";

/** CLI `--all` default — Studio folder, not every dir at `/`. */
export const CLI_DEFAULT_WORKSPACE_IMPORT_SCAN_ROOT = ".";

export type WorkspaceImportScanMode = "repo" | "computer";

export type WorkspaceImportBreadcrumb = {
  label: string;
  scanRoot: string;
};

export type WorkspaceImportJumpTarget = {
  id: "fs" | "home" | "studio";
  label: string;
  scanRoot: string;
};

/** Never offer these as workspace folders (build junk). */
export const WORKSPACE_IMPORT_DIR_DENYLIST = new Set([
  "node_modules",
  "dist",
  "build",
  "coverage",
  "tmp",
  "temp",
  ".git",
  ".vol",
  ".nofollow",
  ".resolve",
]);

export type WorkspaceImportCandidate = {
  id: string;
  name: string;
  /** Registry path — relative under Studio folder, or absolute on disk. */
  path: string;
  dirName: string;
  registered: boolean;
  protected: boolean;
  hasProjectJson: boolean;
  /** True when this row is the folder we are currently browsing. */
  isScanRoot?: boolean;
  mtimeMs?: number | null;
  sizeBytes?: number | null;
  kind?: string;
};

export function workspaceImportItemKind(registered: boolean): string {
  return registered ? "Workspace" : "Folder";
}

export type WorkspaceImportApplyInput = {
  /** Candidate ids (or dir names) to link into the registry. */
  selectedIds: string[];
  scanRoot?: string;
};

export function isAbsoluteWorkspaceScanRoot(scanRoot: string): boolean {
  const t = scanRoot.trim().replace(/\\/g, "/");
  if (t.startsWith("/")) return true;
  return /^[A-Za-z]:\//.test(t);
}

export function isFilesystemRootScan(scanRoot: string): boolean {
  const root = normalizeWorkspaceImportScanRoot(scanRoot);
  if (root === "/") return true;
  return /^[A-Za-z]:\/$/.test(root);
}

export function workspaceImportScanMode(
  scanRoot: string,
): WorkspaceImportScanMode {
  const root = normalizeWorkspaceImportScanRoot(scanRoot);
  return isAbsoluteWorkspaceScanRoot(root) ? "computer" : "repo";
}

export function normalizeWorkspaceImportScanRoot(
  raw?: string | null,
): string {
  let t = (raw ?? DEFAULT_WORKSPACE_IMPORT_SCAN_ROOT)
    .trim()
    .replace(/\\/g, "/");
  if (!t || t === "." || t === "./") return ".";
  if (t === "/") return "/";
  const winRoot = t.match(/^([A-Za-z]:)\/?$/);
  if (winRoot) return `${winRoot[1]}/`;
  t = t.replace(/\/+$/, "");
  if (!t) return "/";
  return t.replace(/^\.\//, "");
}

export function posixPathLeaf(absOrRel: string): string {
  const t = absOrRel.replace(/\\/g, "/").replace(/\/+$/, "");
  if (!t || t === "/") return t;
  return t.split("/").filter(Boolean).pop() ?? t;
}

export function joinWorkspaceScanPath(
  scanRoot: string,
  dirName: string,
): string {
  const root = normalizeWorkspaceImportScanRoot(scanRoot);
  const name = dirName.trim();
  if (root === ".") return name;
  if (root === "/") return `/${name}`;
  if (/^[A-Za-z]:\/$/.test(root)) return `${root}${name}`;
  return `${root}/${name}`;
}

/** Skip `.` / `..` / denylist. Repo mode also skips dot + `_` dirs. */
export function shouldIncludeWorkspaceScanDirName(
  name: string,
  mode: WorkspaceImportScanMode = "repo",
): boolean {
  const n = name.trim();
  if (!n || n === "." || n === "..") return false;
  if (WORKSPACE_IMPORT_DIR_DENYLIST.has(n)) return false;
  switch (mode) {
    case "computer":
      return true;
    case "repo":
      if (n.startsWith(".")) return false;
      if (n.startsWith("_")) return false;
      return true;
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

export function relativeWorkspaceCandidatePath(
  scanRootRel: string,
  dirName: string,
): string {
  return joinWorkspaceScanPath(scanRootRel, dirName);
}

export function parentWorkspaceImportScanRoot(
  scanRoot: string,
): string | null {
  const root = normalizeWorkspaceImportScanRoot(scanRoot);
  if (root === "." || isFilesystemRootScan(root)) return null;
  if (root.startsWith("/")) {
    const parts = root.split("/").filter(Boolean);
    if (parts.length <= 1) return "/";
    return `/${parts.slice(0, -1).join("/")}`;
  }
  const win = root.match(/^([A-Za-z]:)\/(.*)$/);
  if (win) {
    const rest = win[2].split("/").filter(Boolean);
    if (rest.length <= 1) return `${win[1]}/`;
    return `${win[1]}/${rest.slice(0, -1).join("/")}`;
  }
  const rel = root.split("/").filter(Boolean);
  if (rel.length <= 1) return ".";
  return rel.slice(0, -1).join("/");
}

export function parentAbsWorkspaceImportScanRoot(
  absPath: string,
): string | null {
  const t = absPath.replace(/\\/g, "/").replace(/\/+$/, "") || "/";
  return parentWorkspaceImportScanRoot(t);
}

export function canSelectAllWorkspaceImport(scanRoot: string): boolean {
  return !isFilesystemRootScan(scanRoot);
}

export function workspaceImportBreadcrumb(
  scanRoot: string,
): WorkspaceImportBreadcrumb[] {
  const root = normalizeWorkspaceImportScanRoot(scanRoot);
  if (root === ".") {
    return [{ label: "Studio folder", scanRoot: "." }];
  }
  if (isFilesystemRootScan(root)) {
    return [{ label: "Disk root", scanRoot: root }];
  }
  if (root.startsWith("/")) {
    const segs: WorkspaceImportBreadcrumb[] = [
      { label: "Disk root", scanRoot: "/" },
    ];
    let acc = "";
    for (const part of root.split("/").filter(Boolean)) {
      acc += `/${part}`;
      segs.push({ label: part, scanRoot: acc });
    }
    return segs;
  }
  const rel = root.split("/").filter(Boolean);
  const segs: WorkspaceImportBreadcrumb[] = [
    { label: "Studio folder", scanRoot: "." },
  ];
  let acc = "";
  for (const part of rel) {
    acc = acc ? `${acc}/${part}` : part;
    segs.push({ label: part, scanRoot: acc });
  }
  return segs;
}

export function workspaceImportJumpTargets(input: {
  fsRoot: string;
  homeDir: string;
  studioRoot: string;
}): WorkspaceImportJumpTarget[] {
  const fsRoot = normalizeWorkspaceImportScanRoot(input.fsRoot || "/");
  const out: WorkspaceImportJumpTarget[] = [];
  const home = input.homeDir.trim().replace(/\\/g, "/").replace(/\/+$/, "");
  if (home && isAbsoluteWorkspaceScanRoot(home)) {
    out.push({ id: "home", label: "Home", scanRoot: home });
  }
  out.push({ id: "fs", label: "Disk root", scanRoot: fsRoot });
  const studio = input.studioRoot
    .trim()
    .replace(/\\/g, "/")
    .replace(/\/+$/, "");
  if (studio && isAbsoluteWorkspaceScanRoot(studio)) {
    out.push({ id: "studio", label: "Studio folder", scanRoot: studio });
  }
  return out;
}

export function resolveWorkspaceCandidateIdentity(input: {
  dirName: string;
  configId?: string | null;
  configName?: string | null;
}): { id: string; name: string } {
  const dir = input.dirName.trim();
  const fromConfig =
    typeof input.configId === "string" && input.configId.trim()
      ? slugifyPlanningWorkspaceName(input.configId)
      : "";
  const id = fromConfig || slugifyPlanningWorkspaceName(dir);
  const name =
    typeof input.configName === "string" && input.configName.trim()
      ? input.configName.trim()
      : dir;
  return { id, name };
}

function posixTrim(p: string): string {
  const t = p.replace(/\\/g, "/").replace(/\/+$/, "");
  return t || "/";
}

export function scanRootWorkspaceCandidate(input: {
  scanRoot: string;
  absPath: string;
  configId?: string | null;
  configName?: string | null;
  hasProjectJson?: boolean;
  mtimeMs?: number | null;
  sizeBytes?: number | null;
  registry: ProjectRegistry;
  registeredAbsPaths?: readonly string[];
}): WorkspaceImportCandidate | null {
  const root = normalizeWorkspaceImportScanRoot(input.scanRoot);
  const abs = posixTrim(input.absPath);
  if (isFilesystemRootScan(root) || isFilesystemRootScan(abs)) return null;
  const leaf = posixPathLeaf(abs) || posixPathLeaf(root);
  if (!leaf) return null;
  const identity = resolveWorkspaceCandidateIdentity({
    dirName: leaf,
    configId: input.configId,
    configName: input.configName,
  });
  const path =
    workspaceImportScanMode(root) === "computer" ? abs : root === "." ? leaf : root;
  const registeredAbs = new Set(
    (input.registeredAbsPaths ?? []).map((p) => posixTrim(p)),
  );
  const registeredByPath = new Map(
    input.registry.projects.map((p) => [posixTrim(p.path), p]),
  );
  const registeredIds = new Set(input.registry.projects.map((p) => p.id));
  const byPath = registeredByPath.get(path) ?? registeredByPath.get(abs);
  const registered =
    Boolean(byPath) ||
    registeredIds.has(identity.id) ||
    registeredAbs.has(abs) ||
    registeredAbs.has(path);
  const id = byPath?.id ?? identity.id;
  const name = byPath?.name?.trim() || identity.name;
  return {
    id,
    name,
    path,
    dirName: leaf,
    registered,
    protected: isWorkspaceProtectedId(id),
    hasProjectJson: input.hasProjectJson === true,
    isScanRoot: true,
    mtimeMs: input.mtimeMs ?? null,
    sizeBytes: input.sizeBytes ?? null,
    kind: workspaceImportItemKind(registered),
  };
}

export function buildWorkspaceImportCandidates(input: {
  scanRootRel?: string;
  dirs: readonly {
    dirName: string;
    /** Relative path under scan root (supports nested e.g. `projects/demo-blog`). */
    relPath?: string;
    /** Absolute disk path when browsing the computer. */
    absPath?: string;
    configId?: string | null;
    configName?: string | null;
    hasProjectJson?: boolean;
    mtimeMs?: number | null;
    sizeBytes?: number | null;
    kind?: string;
  }[];
  registry: ProjectRegistry;
  registeredAbsPaths?: readonly string[];
}): WorkspaceImportCandidate[] {
  const scanRootRel = normalizeWorkspaceImportScanRoot(input.scanRootRel);
  const mode = workspaceImportScanMode(scanRootRel);
  const registeredByPath = new Map(
    input.registry.projects.map((p) => [
      p.path.replace(/\\/g, "/").replace(/\/+$/, ""),
      p,
    ]),
  );
  const registeredIds = new Set(input.registry.projects.map((p) => p.id));
  const registeredAbs = new Set(
    (input.registeredAbsPaths ?? []).map((p) => posixTrim(p)),
  );

  const out: WorkspaceImportCandidate[] = [];
  for (const dir of input.dirs) {
    const leaf = (dir.relPath ?? dir.dirName).trim().split("/").pop() ?? "";
    if (!shouldIncludeWorkspaceScanDirName(leaf, mode)) continue;
    const abs = dir.absPath?.trim() ? posixTrim(dir.absPath) : "";
    const path =
      abs && mode === "computer"
        ? abs
        : dir.relPath?.trim()
          ? relativeWorkspaceCandidatePath(scanRootRel, dir.relPath.trim())
          : relativeWorkspaceCandidatePath(scanRootRel, dir.dirName);
    const identity = resolveWorkspaceCandidateIdentity({
      dirName: leaf || dir.dirName,
      configId: dir.configId,
      configName: dir.configName,
    });
    const byPath = registeredByPath.get(path) ?? registeredByPath.get(abs);
    const registered =
      Boolean(byPath) ||
      registeredIds.has(identity.id) ||
      (abs ? registeredAbs.has(abs) : false) ||
      registeredAbs.has(posixTrim(path));
    const id = byPath?.id ?? identity.id;
    const name = byPath?.name?.trim() || identity.name;
    out.push({
      id,
      name,
      path,
      dirName: leaf || dir.dirName.trim(),
      registered,
      protected: isWorkspaceProtectedId(id),
      hasProjectJson: dir.hasProjectJson === true,
      mtimeMs: dir.mtimeMs ?? null,
      sizeBytes: dir.sizeBytes ?? null,
      kind: dir.kind ?? workspaceImportItemKind(registered),
    });
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

export function parseWorkspaceImportApplyInput(
  raw: Record<string, unknown>,
):
  | { ok: true; value: WorkspaceImportApplyInput }
  | { ok: false; error: string } {
  const scanRoot =
    typeof raw.scanRoot === "string" ? raw.scanRoot : undefined;
  const selectedRaw = raw.selectedIds ?? raw.ids ?? raw.projectIds;
  if (!Array.isArray(selectedRaw)) {
    return { ok: false, error: "selectedIds (array) is required" };
  }
  const selectedIds = [
    ...new Set(
      selectedRaw
        .filter((x): x is string => typeof x === "string")
        .map((x) => x.trim())
        .filter(Boolean),
    ),
  ];
  if (selectedIds.length === 0) {
    return { ok: false, error: "selectedIds must not be empty" };
  }
  return {
    ok: true,
    value: { selectedIds, scanRoot },
  };
}

/**
 * Which candidates to link given a checkbox selection.
 * Already-registered ids are skipped (no-op). Unknown ids → error list.
 */
export function planWorkspaceImportLinks(input: {
  candidates: readonly WorkspaceImportCandidate[];
  selectedIds: readonly string[];
}): {
  toLink: WorkspaceImportCandidate[];
  alreadyRegistered: string[];
  unknownIds: string[];
} {
  const byId = new Map(input.candidates.map((c) => [c.id, c]));
  const byDir = new Map(input.candidates.map((c) => [c.dirName, c]));
  const toLink: WorkspaceImportCandidate[] = [];
  const alreadyRegistered: string[] = [];
  const unknownIds: string[] = [];
  const seen = new Set<string>();

  for (const raw of input.selectedIds) {
    const key = raw.trim();
    if (!key || seen.has(key)) continue;
    const c = byId.get(key) ?? byDir.get(key);
    if (!c) {
      unknownIds.push(key);
      continue;
    }
    seen.add(c.id);
    if (c.registered) {
      alreadyRegistered.push(c.id);
      continue;
    }
    toLink.push(c);
  }
  return { toLink, alreadyRegistered, unknownIds };
}

/** Human label for Settings / CLI — disk root vs Studio folder vs a path. */
export function workspaceImportScanRootLabel(scanRoot: string): string {
  const root = normalizeWorkspaceImportScanRoot(scanRoot);
  if (root === ".") return "Studio folder";
  if (isFilesystemRootScan(root)) return "this computer";
  return root.endsWith("/") ? root : `${root}/`;
}
