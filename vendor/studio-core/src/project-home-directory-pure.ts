/**
 * Project Home — unified directory rows (overview / chats / apps)
 * for a workflows-style table. Pure — no DOM.
 */

import {
  filterDirectoryByCategory,
  filterDirectoryByQuery,
  paginateDirectory,
  type DirectoryNavGroup,
  type DirectoryPageResult,
} from "./directory-pure.js";
import type {
  ProjectHomeChatRow,
  ProjectHomeIdentity,
  ProjectHomeOverview,
  ProjectHomeSectionDef,
} from "./project-home-pure.js";
import type { ProjectRunStatus } from "./project-runtime-pure.js";

export const PROJECT_HOME_DIRECTORY_PAGE_SIZE = 24;

export type ProjectHomeDirectoryKind = "overview" | "chat" | "folder";

export type ProjectHomeDirectoryRow = {
  id: string;
  kind: ProjectHomeDirectoryKind;
  subtype: string;
  title: string;
  subtitle: string;
  /** Second column label (Overview / Chat / App). */
  typeLabel: string;
  status: string;
  sortAt: number;
  ref: {
    chatId?: string;
    section?: ProjectHomeSectionDef;
    /** overview field key when kind is overview */
    field?: string;
  };
};

export const PROJECT_HOME_DIRECTORY_NAV: readonly DirectoryNavGroup[] = [
  {
    id: "browse",
    label: "Browse",
    items: [
      { id: "all", label: "All" },
      { id: "overview", label: "Overview" },
      { id: "chats", label: "Chats" },
      { id: "apps", label: "Apps" },
    ],
  },
] as const;

/** Project-home section ids that are not Apps directory rows. */
const APP_SECTION_SKIP = new Set([
  "identity",
  "overview",
  "chats",
  "hosting",
]);

export function buildProjectHomeDirectoryRows(input: {
  identity?: ProjectHomeIdentity | null;
  overview?: ProjectHomeOverview | null;
  chats?: readonly ProjectHomeChatRow[];
  sections?: readonly ProjectHomeSectionDef[];
  runStatusLabel: (status: ProjectRunStatus) => string;
}): ProjectHomeDirectoryRow[] {
  const rows: ProjectHomeDirectoryRow[] = [];
  const id = input.identity;
  const ov = input.overview;

  if (id) {
    rows.push({
      id: "overview:identity",
      kind: "overview",
      subtype: "identity",
      title: id.displayName,
      subtitle: projectHomeIdentitySubtitle(id),
      typeLabel: "Overview",
      status: "ready",
      sortAt: 400,
      ref: { field: "identity" },
    });
  }

  if (ov) {
    rows.push({
      id: "overview:run",
      kind: "overview",
      subtype: "run",
      title: input.runStatusLabel(ov.runStatus),
      subtitle: "Dev server",
      typeLabel: "Overview",
      status: ov.runStatus,
      sortAt: 300,
      ref: { field: "run" },
    });
    rows.push({
      id: "overview:live",
      kind: "overview",
      subtype: "live",
      title: ov.liveUrl || "—",
      subtitle: "Website URL",
      typeLabel: "Overview",
      status: ov.liveUrl ? "ready" : "—",
      sortAt: 290,
      ref: { field: "live" },
    });
    rows.push({
      id: "overview:prod",
      kind: "overview",
      subtype: "prod",
      title: ov.prodUrl || "No prod URL in project.json",
      subtitle: "Prod URL · deploy soon",
      typeLabel: "Overview",
      status: ov.prodUrl ? "ready" : "stub",
      sortAt: 280,
      ref: { field: "prod" },
    });
    if (ov.mode) {
      rows.push({
        id: "overview:mode",
        kind: "overview",
        subtype: "mode",
        title: ov.mode,
        subtitle: "Project mode",
        typeLabel: "Overview",
        status: "ready",
        sortAt: 270,
        ref: { field: "mode" },
      });
    }
  }

  for (const c of input.chats ?? []) {
    rows.push({
      id: `chat:${c.id}`,
      kind: "chat",
      subtype: "chat",
      title: c.title,
      subtitle: "Recent chat",
      typeLabel: "Chat",
      status: "ready",
      sortAt: c.updatedAt,
      ref: { chatId: c.id },
    });
  }

  for (const s of (input.sections ?? []).filter(
    (sec) => !APP_SECTION_SKIP.has(sec.id),
  )) {
    rows.push({
      id: `folder:${s.id}`,
      kind: "folder",
      subtype: s.id,
      title: s.title,
      subtitle: s.subtitle,
      typeLabel: "App",
      status: s.status,
      sortAt: 0,
      ref: { section: s },
    });
  }

  return rows.sort((a, b) => {
    const kindOrder = { overview: 0, chat: 1, folder: 2 } as const;
    const ko = kindOrder[a.kind] - kindOrder[b.kind];
    if (ko !== 0) return ko;
    if (a.kind === "chat") return b.sortAt - a.sortAt;
    if (a.kind === "overview") return b.sortAt - a.sortAt;
    return a.title.localeCompare(b.title);
  });
}

/** Legacy folders / surfaces → apps (nav + filter SoT). */
export function normalizeProjectHomeCategory(categoryId: string): string {
  const id = categoryId.trim().toLowerCase();
  if (id === "folders" || id === "surfaces") return "apps";
  return categoryId;
}

function matchProjectHomeCategory(
  row: ProjectHomeDirectoryRow,
  categoryId: string,
): boolean {
  switch (normalizeProjectHomeCategory(categoryId)) {
    case "overview":
      return row.kind === "overview";
    case "chats":
      return row.kind === "chat";
    case "apps":
      return row.kind === "folder";
    default:
      return true;
  }
}

export function queryProjectHomeDirectory(input: {
  rows: readonly ProjectHomeDirectoryRow[];
  category: string;
  search: string;
  page: number;
  pageSize?: number;
}): DirectoryPageResult<ProjectHomeDirectoryRow> {
  const byCat = filterDirectoryByCategory(
    input.rows,
    input.category,
    matchProjectHomeCategory,
  );
  const byQuery = filterDirectoryByQuery(byCat, input.search, (row) => [
    row.title,
    row.subtitle,
    row.typeLabel,
    row.status,
    row.kind,
    row.subtype,
  ]);
  return paginateDirectory(
    byQuery,
    input.page,
    input.pageSize ?? PROJECT_HOME_DIRECTORY_PAGE_SIZE,
  );
}

export function projectHomeDirectoryStatusLabel(
  row: ProjectHomeDirectoryRow,
): string {
  if (row.kind === "folder") {
    if (row.status === "stub") return "Soon";
    if (row.status === "link") return "Open";
    if (row.status === "ready") return "Ready";
  }
  if (row.status === "stub") return "Soon";
  if (row.status === "ready") return "Ready";
  return row.status;
}

export function projectHomeIdentitySubtitle(id: ProjectHomeIdentity): string {
  const mark = id.emoji?.trim() || id.initials;
  return `${id.projectId} · ${mark}`;
}

export function projectHomeDirectoryActionLabel(
  row: ProjectHomeDirectoryRow,
): string {
  if (row.kind === "overview" && row.subtype === "identity") return "Set icon";
  if (row.kind === "chat") return "Chat";
  if (row.kind === "folder") {
    if (row.status === "stub") return "Soon";
    return "Open";
  }
  return "—";
}
