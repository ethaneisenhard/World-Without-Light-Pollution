/**
 * Settings hub directory rows (workspaces / activity / apps)
 * for a workflows-style table. Pure — no DOM.
 * (Formerly Agent Home browse — now hosted under Settings.)
 */

import {
  filterDirectoryByCategory,
  filterDirectoryByQuery,
  paginateDirectory,
  type DirectoryNavGroup,
  type DirectoryPageResult,
} from "./directory-pure.js";
import type {
  OverviewActivityRow,
  OverviewProjectCard,
} from "./studio-overview-pure.js";
import type { ProjectHomeSectionDef } from "./project-home-pure.js";

export const HOME_DIRECTORY_PAGE_SIZE = 24;

export type HomeDirectoryKind = "project" | "activity" | "folder";

export type HomeDirectoryRow = {
  id: string;
  kind: HomeDirectoryKind;
  /** Sub-kind for activity: chat | event; for folder: section id. */
  subtype: string;
  title: string;
  subtitle: string;
  /** Workspace / project id, or "studio". */
  workspace: string;
  /** Mode, ready/stub/link, or activity kind label. */
  status: string;
  /** Sort key — projects first by name, then activity by `at`, then apps. */
  sortAt: number;
  /** Opaque payload for hosts (project id, chat id, section def). */
  ref: {
    projectId?: string;
    chatId?: string;
    section?: ProjectHomeSectionDef;
  };
};

/** @deprecated Prefer SETTINGS_HUB_DIRECTORY — kept for Workspace Home parity helpers. */
export const HOME_DIRECTORY_NAV: readonly DirectoryNavGroup[] = [
  {
    id: "browse",
    label: "Browse",
    items: [
      { id: "workspaces", label: "Workspaces" },
      { id: "activity", label: "Activity" },
      { id: "apps", label: "Apps" },
    ],
  },
] as const;

/** Section ids that are not Apps directory rows. */
const APP_SECTION_SKIP = new Set([
  "identity",
  "overview",
  "chats",
  "hosting",
  /** Config lives as Settings hub peers — not an App launcher. */
  "settings",
]);

export function buildHomeDirectoryRows(input: {
  projects?: readonly OverviewProjectCard[];
  activity?: readonly OverviewActivityRow[];
  sections?: readonly ProjectHomeSectionDef[];
  activeProjectId?: string | null;
}): HomeDirectoryRow[] {
  const rows: HomeDirectoryRow[] = [];

  for (const p of input.projects ?? []) {
    rows.push({
      id: `project:${p.id}`,
      kind: "project",
      subtype: "workspace",
      title: p.name,
      subtitle: p.id,
      workspace: p.id,
      status: p.mode ?? "—",
      sortAt: 0,
      ref: { projectId: p.id },
    });
  }

  for (const a of input.activity ?? []) {
    rows.push({
      id: `activity:${a.kind}:${a.id}`,
      kind: "activity",
      subtype: a.kind,
      title: a.title,
      subtitle: a.kind,
      workspace: a.projectId ?? "studio",
      status: a.kind,
      sortAt: a.at,
      ref: {
        projectId: a.projectId ?? undefined,
        chatId: a.kind === "chat" ? a.id : undefined,
      },
    });
  }

  const sections = (input.sections ?? []).filter(
    (s) => !APP_SECTION_SKIP.has(s.id),
  );
  for (const s of sections) {
    rows.push({
      id: `folder:${s.id}`,
      kind: "folder",
      subtype: s.id,
      title: s.title,
      subtitle: s.subtitle,
      workspace: input.activeProjectId ?? "studio",
      status: s.status,
      sortAt: 0,
      ref: { section: s, projectId: input.activeProjectId ?? undefined },
    });
  }

  return rows.sort((a, b) => {
    const kindOrder = { project: 0, activity: 1, folder: 2 } as const;
    const ko = kindOrder[a.kind] - kindOrder[b.kind];
    if (ko !== 0) return ko;
    if (a.kind === "activity") return b.sortAt - a.sortAt;
    return a.title.localeCompare(b.title);
  });
}

function matchHomeCategory(row: HomeDirectoryRow, categoryId: string): boolean {
  switch (categoryId) {
    case "workspaces":
    case "projects": // legacy
      return row.kind === "project";
    case "activity":
      return row.kind === "activity";
    case "apps":
    case "folders":
    case "surfaces": // legacy
      return row.kind === "folder";
    default:
      return true;
  }
}

export function queryHomeDirectory(input: {
  rows: readonly HomeDirectoryRow[];
  category: string;
  search: string;
  page: number;
  pageSize?: number;
}): DirectoryPageResult<HomeDirectoryRow> {
  const byCat = filterDirectoryByCategory(
    input.rows,
    input.category,
    matchHomeCategory,
  );
  const byQuery = filterDirectoryByQuery(byCat, input.search, (row) => [
    row.title,
    row.subtitle,
    row.workspace,
    row.status,
    row.kind,
    row.subtype,
  ]);
  return paginateDirectory(
    byQuery,
    input.page,
    input.pageSize ?? HOME_DIRECTORY_PAGE_SIZE,
  );
}

export function homeKindLabel(kind: HomeDirectoryKind): string {
  switch (kind) {
    case "project":
      return "Workspace";
    case "activity":
      return "Activity";
    case "folder":
      return "App";
    default:
      return kind;
  }
}

export function homeStatusLabel(row: HomeDirectoryRow): string {
  if (row.kind === "project") return row.status;
  if (row.kind === "activity") return row.subtype;
  if (row.status === "stub") return "Soon";
  if (row.status === "link") return "Open";
  if (row.status === "ready") return "Ready";
  return row.status;
}
