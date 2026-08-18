/**
 * Settings directory projections — Skills / Rules / Providers / MCP tools.
 * Pure filter + paginate via shared directory helpers.
 */

import {
  filterDirectoryByCategory,
  filterDirectoryByQuery,
  paginateDirectory,
  type DirectoryNavGroup,
  type DirectoryPageResult,
} from "./directory-pure.js";
import type { MergedRule } from "./rules-manifest-pure.js";
import type { ToolDef } from "./tool-catalog-pure.js";

export const SETTINGS_DIRECTORY_PAGE_SIZE = 9;

export type SettingsDirectoryEntry = {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  status?: "on" | "off" | "available";
  meta?: string;
  /** Studio tool toggle vs MCP plane (Kody) connect card. */
  kind?: "studio-tool" | "mcp-plane";
  action?: "toggle" | "connect" | "enable" | "ready";
  actionLabel?: string;
};

export const SKILLS_DIRECTORY_NAV: readonly DirectoryNavGroup[] = [
  {
    id: "explore",
    label: "Explore",
    items: [
      { id: "all", label: "All" },
      { id: "bundled", label: "Bundled (vendor)" },
      { id: "studio", label: "Studio" },
      { id: "project", label: "Project" },
    ],
  },
] as const;

export const RULES_DIRECTORY_NAV: readonly DirectoryNavGroup[] = [
  {
    id: "explore",
    label: "Explore",
    items: [
      { id: "all", label: "All" },
      { id: "enabled", label: "Enabled" },
      { id: "studio", label: "Studio" },
      { id: "project", label: "Project" },
    ],
  },
] as const;

export const MCP_TOOLS_DIRECTORY_NAV: readonly DirectoryNavGroup[] = [
  {
    id: "explore",
    label: "Explore",
    items: [
      { id: "all", label: "All" },
      { id: "enabled", label: "Enabled" },
      { id: "disabled", label: "Disabled" },
    ],
  },
  {
    id: "categories",
    label: "Categories",
    items: [
      { id: "files", label: "Files" },
      { id: "git", label: "Git" },
      { id: "mcp", label: "MCP" },
      { id: "skills", label: "Skills" },
      { id: "deploy", label: "Deploy" },
      { id: "studio", label: "Studio" },
      { id: "other", label: "Other" },
    ],
  },
] as const;

export const PROVIDERS_DIRECTORY_NAV: readonly DirectoryNavGroup[] = [
  {
    id: "explore",
    label: "Explore",
    items: [
      { id: "all", label: "All" },
      { id: "configured", label: "Configured" },
      { id: "empty", label: "Empty" },
    ],
  },
] as const;

function toolCategory(id: string): string {
  if (id.startsWith("files.")) return "files";
  if (id.startsWith("git.")) return "git";
  if (id.startsWith("mcp.")) return "mcp";
  if (id.startsWith("skills.")) return "skills";
  if (id.startsWith("deploy.")) return "deploy";
  if (id.startsWith("studio.")) return "studio";
  if (id === "open_in_editor") return "studio";
  return "other";
}

export function mcpPlaneDirectoryEntry(input: {
  id: string;
  title: string;
  description: string;
  readinessStatus: "ready" | "needs-setup" | "unknown";
  action: "connect" | "enable" | "ready";
  actionLabel: string;
  hint?: string;
}): SettingsDirectoryEntry {
  let status: SettingsDirectoryEntry["status"] = "available";
  switch (input.readinessStatus) {
    case "ready":
      status = "on";
      break;
    case "needs-setup":
      status = "off";
      break;
    case "unknown":
      status = "available";
      break;
    default: {
      const _exhaustive: never = input.readinessStatus;
      return _exhaustive;
    }
  }
  return {
    id: input.id,
    title: input.title,
    description: input.description,
    category: "mcp",
    icon: "cog",
    status,
    meta: input.hint,
    kind: "mcp-plane",
    action: input.action,
    actionLabel: input.actionLabel,
  };
}

export function buildMcpToolDirectoryEntries(
  catalog: readonly ToolDef[],
  toolsEnabled: Record<string, boolean | undefined>,
): SettingsDirectoryEntry[] {
  return catalog.map((t) => {
    const on = toolsEnabled[t.id] !== false;
    return {
      id: t.id,
      title: t.id,
      description: t.description,
      category: toolCategory(t.id),
      icon: toolCategory(t.id) === "git" ? "folder" : "cog",
      status: on ? "on" : "off",
      meta: on ? "Enabled" : "Disabled",
      kind: "studio-tool" as const,
      action: "toggle" as const,
    };
  });
}

export function queryMcpToolsDirectory(input: {
  catalog: readonly ToolDef[];
  toolsEnabled: Record<string, boolean | undefined>;
  category: string;
  search: string;
  page: number;
  pageSize?: number;
  extraEntries?: readonly SettingsDirectoryEntry[];
}): DirectoryPageResult<SettingsDirectoryEntry> {
  const entries = [
    ...(input.extraEntries ?? []),
    ...buildMcpToolDirectoryEntries(
      input.catalog,
      input.toolsEnabled,
    ),
  ];
  const byCat = filterDirectoryByCategory(entries, input.category, (e, cat) => {
    if (cat === "enabled") return e.status === "on";
    if (cat === "disabled") return e.status === "off";
    return e.category === cat;
  });
  const filtered = filterDirectoryByQuery(byCat, input.search, (e) => [
    e.title,
    e.description,
    e.category,
    e.id,
  ]);
  return paginateDirectory(
    filtered,
    input.page,
    input.pageSize ?? SETTINGS_DIRECTORY_PAGE_SIZE,
  );
}

export function buildSkillsDirectoryEntries(
  skills: ReadonlyArray<{
    id: string;
    name?: string;
    description?: string;
    source?: string;
    folder?: string;
  }>,
): SettingsDirectoryEntry[] {
  return skills.map((s) => {
    const source = s.source ?? "bundled";
    const leaf = s.id.includes("/")
      ? s.id.slice(s.id.lastIndexOf("/") + 1)
      : s.id;
    return {
      id: `${source}:${s.id}`,
      title: s.name ?? leaf,
      description: s.description ?? "",
      category:
        source === "project" || source === "studio" ? source : "bundled",
      icon: "bolt",
      status: "available" as const,
      meta: `${source} · ${s.id}`,
    };
  });
}

export function querySkillsDirectory(input: {
  skills: ReadonlyArray<{
    id: string;
    name?: string;
    description?: string;
    source?: string;
    folder?: string;
  }>;
  category: string;
  search: string;
  page: number;
  pageSize?: number;
}): DirectoryPageResult<SettingsDirectoryEntry> {
  const entries = buildSkillsDirectoryEntries(input.skills);
  const byCat = filterDirectoryByCategory(entries, input.category, (e, cat) => {
    return e.category === cat;
  });
  const filtered = filterDirectoryByQuery(byCat, input.search, (e) => [
    e.title,
    e.description,
    e.meta,
    e.id,
  ]);
  return paginateDirectory(
    filtered,
    input.page,
    input.pageSize ?? SETTINGS_DIRECTORY_PAGE_SIZE,
  );
}

export function buildRulesDirectoryEntries(
  rules: readonly MergedRule[],
): SettingsDirectoryEntry[] {
  return rules.map((r) => ({
    id: `${r.scope}:${r.id}`,
    title: r.title ?? r.id,
    description: r.path,
    category: r.scope,
    icon: "folder",
    status: r.enabled ? "on" : "off",
    meta: `${r.scope} · ${r.path}`,
  }));
}

export function queryRulesDirectory(input: {
  rules: readonly MergedRule[];
  category: string;
  search: string;
  page: number;
  pageSize?: number;
}): DirectoryPageResult<SettingsDirectoryEntry> {
  const entries = buildRulesDirectoryEntries(input.rules);
  const byCat = filterDirectoryByCategory(entries, input.category, (e, cat) => {
    if (cat === "enabled") return e.status === "on";
    return e.category === cat;
  });
  const filtered = filterDirectoryByQuery(byCat, input.search, (e) => [
    e.title,
    e.description,
    e.meta,
    e.id,
  ]);
  return paginateDirectory(
    filtered,
    input.page,
    input.pageSize ?? SETTINGS_DIRECTORY_PAGE_SIZE,
  );
}

export type ProviderKey = "calendar" | "media" | "email" | "analytics";

export const PROVIDER_KEYS: readonly ProviderKey[] = [
  "calendar",
  "media",
  "email",
  "analytics",
] as const;

export function buildProvidersDirectoryEntries(
  providers: Partial<
    Record<ProviderKey, { plugin?: string } | undefined>
  >,
): SettingsDirectoryEntry[] {
  return PROVIDER_KEYS.map((key) => {
    const plugin = providers[key]?.plugin?.trim() ?? "";
    return {
      id: key,
      title: key,
      description: plugin
        ? `Plugin: ${plugin}`
        : "No plugin id — set @glassbox-studio/… package",
      category: plugin ? "configured" : "empty",
      icon: "puzzle",
      status: plugin ? "on" : "off",
      meta: plugin || "Empty",
    };
  });
}

export function queryProvidersDirectory(input: {
  providers: Partial<
    Record<ProviderKey, { plugin?: string } | undefined>
  >;
  category: string;
  search: string;
  page: number;
  pageSize?: number;
}): DirectoryPageResult<SettingsDirectoryEntry> {
  const entries = buildProvidersDirectoryEntries(input.providers);
  const byCat = filterDirectoryByCategory(entries, input.category, (e, cat) => {
    return e.category === cat;
  });
  const filtered = filterDirectoryByQuery(byCat, input.search, (e) => [
    e.title,
    e.description,
    e.meta,
  ]);
  return paginateDirectory(
    filtered,
    input.page,
    input.pageSize ?? SETTINGS_DIRECTORY_PAGE_SIZE,
  );
}
