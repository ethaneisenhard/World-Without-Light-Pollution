/**
 * Finder-style workspace folder browser — history, search filter, folder face.
 * Pure: no DOM / fetch.
 */

import type { WorkspaceImportCandidate } from "./workspace-import-candidates-pure.js";

export type WorkspaceImportViewMode = "icons" | "list";

export type WorkspaceImportFolderFace = "workspace" | "folder";

export type WorkspaceImportHistory = {
  back: string[];
  forward: string[];
};

export function workspaceImportFolderFace(
  registered: boolean,
): WorkspaceImportFolderFace {
  return registered ? "workspace" : "folder";
}

export function filterWorkspaceImportFolders(
  candidates: readonly WorkspaceImportCandidate[],
  query: string,
): WorkspaceImportCandidate[] {
  const visible = candidates.filter((c) => !c.isScanRoot);
  const q = query.trim().toLowerCase();
  if (!q) return visible;
  return visible.filter((c) => {
    const name = c.name.toLowerCase();
    const path = c.path.toLowerCase();
    return name.includes(q) || path.includes(q);
  });
}

export function workspaceImportCurrentFolder(
  candidates: readonly WorkspaceImportCandidate[],
): WorkspaceImportCandidate | null {
  return candidates.find((c) => c.isScanRoot) ?? null;
}

export function canWorkspaceImportGoBack(history: WorkspaceImportHistory): boolean {
  return history.back.length > 0;
}

export function canWorkspaceImportGoForward(
  history: WorkspaceImportHistory,
): boolean {
  return history.forward.length > 0;
}

export function workspaceImportHistoryAfterNavigate(input: {
  history: WorkspaceImportHistory;
  current: string;
  next: string;
}): WorkspaceImportHistory {
  const current = input.current.trim();
  const next = input.next.trim();
  if (!next || next === current) return input.history;
  return {
    back: current ? [...input.history.back, current] : input.history.back,
    forward: [],
  };
}

export function workspaceImportHistoryGoBack(input: {
  history: WorkspaceImportHistory;
  current: string;
}): { history: WorkspaceImportHistory; scanRoot: string } | null {
  if (input.history.back.length === 0) return null;
  const scanRoot = input.history.back[input.history.back.length - 1]!;
  return {
    scanRoot,
    history: {
      back: input.history.back.slice(0, -1),
      forward: [input.current, ...input.history.forward],
    },
  };
}

export function workspaceImportHistoryGoForward(input: {
  history: WorkspaceImportHistory;
  current: string;
}): { history: WorkspaceImportHistory; scanRoot: string } | null {
  if (input.history.forward.length === 0) return null;
  const scanRoot = input.history.forward[0]!;
  return {
    scanRoot,
    history: {
      back: [...input.history.back, input.current],
      forward: input.history.forward.slice(1),
    },
  };
}

export function workspaceImportSelectIds(input: {
  selectedIds: readonly string[];
  id: string;
  additive: boolean;
}): string[] {
  const id = input.id.trim();
  if (!id) return [...input.selectedIds];
  if (!input.additive) return [id];
  const set = new Set(input.selectedIds);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  return [...set];
}

export type WorkspaceImportSidebarRow = {
  id: string;
  name: string;
  path: string;
};

function posixTrimPath(p: string): string {
  const t = p.replace(/\\/g, "/").replace(/\/+$/, "");
  return t || "/";
}

/** Registered workspaces for the Finder sidebar — skip empty / disk-root paths. */
export function workspaceImportSidebarRows(
  entries: readonly { id: string; name?: string; path: string }[],
): WorkspaceImportSidebarRow[] {
  const rows: WorkspaceImportSidebarRow[] = [];
  for (const e of entries) {
    const id = e.id.trim();
    const path = posixTrimPath(e.path.trim());
    if (!id || path === "/") continue;
    rows.push({
      id,
      name: (e.name ?? "").trim() || id,
      path,
    });
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

/** True when the Finder is at this workspace or a folder inside it. */
export function isWorkspaceImportSidebarActive(
  here: string,
  workspacePath: string,
): boolean {
  const h = posixTrimPath(here);
  const p = posixTrimPath(workspacePath);
  if (p === "/") return h === p;
  return h === p || h.startsWith(`${p}/`);
}
