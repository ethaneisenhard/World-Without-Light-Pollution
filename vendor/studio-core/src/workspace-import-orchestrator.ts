/**
 * Discover + import workspace candidates from a scan root.
 * Settings defaults to disk root (`/`); CLI `--root .` is the Studio folder.
 */

import { projectMetaCandidates } from "./project-meta-pure.js";
import {
  buildWorkspaceImportCandidates,
  canSelectAllWorkspaceImport,
  isFilesystemRootScan,
  normalizeWorkspaceImportScanRoot,
  parentAbsWorkspaceImportScanRoot,
  parseWorkspaceImportApplyInput,
  planWorkspaceImportLinks,
  scanRootWorkspaceCandidate,
  shouldIncludeWorkspaceScanDirName,
  workspaceImportScanMode,
  type WorkspaceImportCandidate,
} from "./workspace-import-candidates-pure.js";
import {
  workspaceImportSidebarRows,
  type WorkspaceImportSidebarRow,
} from "./workspace-import-finder-pure.js";
import {
  linkWorkspaceOrchestrator,
  type WorkspaceCrudOrchestratorDeps,
} from "./workspace-crud-orchestrator.js";

export type WorkspaceImportOrchestratorDeps = WorkspaceCrudOrchestratorDeps & {
  readdir: (
    path: string,
    opts?: { withFileTypes?: boolean },
  ) => Promise<
    Array<{ name: string; isDirectory: () => boolean } | string>
  >;
  /** Disk root (`/` or `C:/`). */
  fsRoot?: string;
  /** User home on the Host computer. */
  homeDir?: string;
  stat?: (
    path: string,
  ) => Promise<{ mtimeMs: number; size: number } | null>;
};

export type WorkspaceImportDiscoverResult = {
  scanRoot: string;
  scanRootAbs: string;
  fsRoot: string;
  homeDir: string;
  studioRoot: string;
  parentScanRoot: string | null;
  canSelectAll: boolean;
  candidates: WorkspaceImportCandidate[];
  linkedWorkspaces: WorkspaceImportSidebarRow[];
};

async function readCandidateMeta(
  deps: WorkspaceImportOrchestratorDeps,
  absDir: string,
): Promise<{
  configId?: string;
  configName?: string;
  hasProjectJson: boolean;
}> {
  for (const rel of projectMetaCandidates("project.json")) {
    const full = deps.joinPath(absDir, ...rel.split("/"));
    if (deps.pathExists && !(await deps.pathExists(full))) continue;
    try {
      const raw = await deps.fs.readFile(full, "utf8");
      const parsed = JSON.parse(raw) as { id?: unknown; name?: unknown };
      return {
        hasProjectJson: true,
        configId:
          typeof parsed.id === "string" ? parsed.id : undefined,
        configName:
          typeof parsed.name === "string" ? parsed.name : undefined,
      };
    } catch {
      return { hasProjectJson: true };
    }
  }
  return { hasProjectJson: false };
}

async function readDirStat(
  deps: WorkspaceImportOrchestratorDeps,
  absDir: string,
): Promise<{ mtimeMs: number | null; sizeBytes: number | null }> {
  if (!deps.stat) return { mtimeMs: null, sizeBytes: null };
  try {
    const s = await deps.stat(absDir);
    return { mtimeMs: s?.mtimeMs ?? null, sizeBytes: null };
  } catch {
    return { mtimeMs: null, sizeBytes: null };
  }
}

async function listDirNames(
  deps: WorkspaceImportOrchestratorDeps,
  absDir: string,
  scanRoot: string,
): Promise<string[]> {
  const mode = workspaceImportScanMode(scanRoot);
  let entries: Array<{ name: string; isDirectory: () => boolean } | string> =
    [];
  try {
    entries = await deps.readdir(absDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const dirNames: string[] = [];
  for (const ent of entries) {
    if (typeof ent === "string") {
      if (shouldIncludeWorkspaceScanDirName(ent, mode)) dirNames.push(ent);
      continue;
    }
    if (
      ent.isDirectory() &&
      shouldIncludeWorkspaceScanDirName(ent.name, mode)
    ) {
      dirNames.push(ent.name);
    }
  }
  return dirNames;
}

function posixJoin(abs: string, name: string): string {
  const a = abs.replace(/\\/g, "/").replace(/\/+$/, "") || "/";
  if (a === "/") return `/${name}`;
  return `${a}/${name}`;
}

function absScanRoot(
  deps: WorkspaceImportOrchestratorDeps,
  scanRoot: string,
): string {
  if (scanRoot === ".") return deps.repoRoot;
  if (scanRoot.startsWith("/") || /^[A-Za-z]:\//.test(scanRoot)) {
    return scanRoot;
  }
  return deps.joinPath(deps.repoRoot, ...scanRoot.split("/"));
}

function posixAbs(p: string): string {
  const t = p.replace(/\\/g, "/").replace(/\/+$/, "");
  return t || "/";
}

export async function discoverWorkspaceImportCandidatesOrchestrator(
  deps: WorkspaceImportOrchestratorDeps,
  opts?: { scanRoot?: string },
): Promise<WorkspaceImportDiscoverResult> {
  const scanRoot = normalizeWorkspaceImportScanRoot(opts?.scanRoot);
  const absScan = posixAbs(absScanRoot(deps, scanRoot));
  const fsRoot = posixAbs(deps.fsRoot?.trim() || "/");
  const homeDir = (deps.homeDir ?? "").trim().replace(/\\/g, "/");
  const studioRoot = posixAbs(deps.repoRoot);
  const registry = await deps.loadRegistry();
  const registeredAbsPaths = registry.projects.map((p) =>
    posixAbs(deps.resolveProjectRoot(deps.repoRoot, p.path)),
  );
  const linkedWorkspaces = workspaceImportSidebarRows(
    registry.projects.map((p, i) => ({
      id: p.id,
      name: p.name,
      path: registeredAbsPaths[i] ?? "",
    })),
  );
  const dirNames = await listDirNames(deps, absScan, scanRoot);

  const dirs = await Promise.all(
    dirNames.map(async (dirName) => {
      const absDir = posixJoin(absScan, dirName);
      const meta = await readCandidateMeta(deps, absDir);
      const st = await readDirStat(deps, absDir);
      return {
        dirName,
        relPath: dirName,
        absPath: absDir,
        ...meta,
        mtimeMs: st.mtimeMs,
        sizeBytes: st.sizeBytes,
      };
    }),
  );

  const currentMeta = isFilesystemRootScan(absScan)
    ? null
    : await readCandidateMeta(deps, absScan);
  const currentStat = currentMeta ? await readDirStat(deps, absScan) : null;
  const current = currentMeta
    ? scanRootWorkspaceCandidate({
        scanRoot,
        absPath: absScan,
        configId: currentMeta.configId,
        configName: currentMeta.configName,
        hasProjectJson: currentMeta.hasProjectJson,
        mtimeMs: currentStat?.mtimeMs,
        sizeBytes: currentStat?.sizeBytes,
        registry,
        registeredAbsPaths,
      })
    : null;

  const children = buildWorkspaceImportCandidates({
    scanRootRel: scanRoot,
    dirs,
    registry,
    registeredAbsPaths,
  });
  const candidates = current
    ? [current, ...children.filter((c) => c.id !== current.id)]
    : children;

  const parentFromAbs = parentAbsWorkspaceImportScanRoot(absScan);

  return {
    scanRoot,
    scanRootAbs: absScan,
    fsRoot,
    homeDir,
    studioRoot,
    parentScanRoot: parentFromAbs,
    canSelectAll: canSelectAllWorkspaceImport(absScan),
    candidates,
    linkedWorkspaces,
  };
}

export async function importWorkspaceCandidatesOrchestrator(
  deps: WorkspaceImportOrchestratorDeps,
  raw: Record<string, unknown>,
): Promise<{
  scanRoot: string;
  scanRootAbs: string;
  linked: Array<{ id: string; name: string; path: string }>;
  alreadyRegistered: string[];
  unknownIds: string[];
}> {
  const parsed = parseWorkspaceImportApplyInput(raw);
  if (!parsed.ok) throw new Error(parsed.error);

  const discovered = await discoverWorkspaceImportCandidatesOrchestrator(
    deps,
    { scanRoot: parsed.value.scanRoot },
  );
  const plan = planWorkspaceImportLinks({
    candidates: discovered.candidates,
    selectedIds: parsed.value.selectedIds,
  });
  if (plan.unknownIds.length > 0 && plan.toLink.length === 0) {
    throw new Error(
      `Unknown workspace candidate id(s): ${plan.unknownIds.join(", ")}`,
    );
  }

  const linked: Array<{ id: string; name: string; path: string }> = [];
  for (const c of plan.toLink) {
    if (isFilesystemRootScan(c.path)) {
      throw new Error("Cannot add the disk root as a workspace.");
    }
    const row = await linkWorkspaceOrchestrator(deps, {
      id: c.id,
      path: c.path,
      name: c.name,
    });
    linked.push({
      id: row.projectId,
      name: row.name,
      path: row.path,
    });
  }

  return {
    scanRoot: discovered.scanRoot,
    scanRootAbs: discovered.scanRootAbs,
    linked,
    alreadyRegistered: plan.alreadyRegistered,
    unknownIds: plan.unknownIds,
  };
}
