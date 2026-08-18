/**
 * MCP / Integrations directory catalog — connected servers + attachable packs.
 * Same UX surface for MCP connectors and Integrations Settings.
 */

import type { StudioMcpServerConfig } from "./studio-config-pure.js";
import {
  buildDbhubSqliteDsn,
  dbhubStdioNpxArgs,
  defaultDbhubD1StandInPath,
} from "./dbhub-dsn-pure.js";
import { MCP_STARTER_PACKS } from "./mcp-starter-packs-pure.js";
import {
  filterDirectoryByCategory,
  filterDirectoryByQuery,
  paginateDirectory,
  type DirectoryNavGroup,
  type DirectoryPageResult,
} from "./directory-pure.js";

const DBHUB_D1_DSN = buildDbhubSqliteDsn(
  defaultDbhubD1StandInPath("primary-d1"),
);

/** Crisp-like category ids for MCP + project integrations directory. */
export type McpDirectoryCategoryId =
  | "connected"
  | "popular"
  | "project"
  | "automation"
  | "local"
  | "studio"
  | "remote"
  | "other";

export type McpDirectoryIconId =
  | "puzzle"
  | "bolt"
  | "folder"
  | "server"
  | "cloud"
  | "cog"
  | "chat"
  | "circle-stack"
  | "globe"
  | "command-line";

export type McpDirectoryEntry = {
  id: string;
  title: string;
  description: string;
  category: Exclude<McpDirectoryCategoryId, "connected" | "popular" | "project">;
  icon: McpDirectoryIconId;
  /** connected = in config; available = pack not yet attached; disabled = present but off */
  status: "connected" | "available" | "disabled";
  popular?: boolean;
  server: StudioMcpServerConfig;
  entryKind?: "mcp";
};

/** Project `integrations/*.json` row in the same directory. */
export type ProjectIntegrationsDirectoryEntry = {
  id: string;
  title: string;
  description: string;
  category: "project";
  icon: McpDirectoryIconId;
  status: "connected";
  entryKind: "project";
  path: string;
  config: Record<string, unknown>;
};

export type IntegrationsDirectoryEntry =
  | McpDirectoryEntry
  | ProjectIntegrationsDirectoryEntry;

export type ProjectIntegrationConfigRow = {
  id: string;
  path: string;
  config: Record<string, unknown>;
};

export const MCP_DIRECTORY_NAV: readonly DirectoryNavGroup[] = [
  {
    id: "explore",
    label: "Explore",
    items: [
      { id: "connected", label: "Connected" },
      { id: "popular", label: "Most popular" },
      { id: "project", label: "Project configs" },
    ],
  },
  {
    id: "categories",
    label: "Categories",
    items: [
      { id: "automation", label: "Automation" },
      { id: "local", label: "Local" },
      { id: "studio", label: "Studio" },
      { id: "remote", label: "Remote" },
      { id: "other", label: "Other" },
    ],
  },
] as const;

export const MCP_DIRECTORY_PAGE_SIZE = 9;

/** Curated catalog (attachable). Starter packs + extras for a full directory feel. */
export const MCP_DIRECTORY_CATALOG: readonly Omit<
  McpDirectoryEntry,
  "status"
>[] = [
  {
    id: "pack:n8n-local",
    title: "n8n",
    description: "Workflow automation — local MCP at :5678 (set N8N_MCP_TOKEN).",
    category: "automation",
    icon: "bolt",
    popular: true,
    server: MCP_STARTER_PACKS.find((p) => p.id === "n8n-local")!.server,
  },
  {
    id: "pack:filesystem",
    title: "Filesystem",
    description: "Read and write project files via official MCP filesystem server.",
    category: "local",
    icon: "folder",
    popular: true,
    server: MCP_STARTER_PACKS.find((p) => p.id === "filesystem-stdio")!.server,
  },
  {
    id: "pack:studio-http",
    title: "Studio HTTP",
    description: "This Studio API as MCP — same tools the AI tab uses.",
    category: "studio",
    icon: "server",
    popular: true,
    server: MCP_STARTER_PACKS.find((p) => p.id === "studio-http")!.server,
  },
  {
    id: "pack:memory",
    title: "Memory",
    description: "Persistent notes for the agent via MCP memory server.",
    category: "other",
    icon: "circle-stack",
    popular: true,
    server: {
      id: "memory",
      kind: "stdio",
      enabled: true,
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-memory"],
      label: "Memory",
    },
  },
  {
    id: "pack:github",
    title: "GitHub",
    description: "Repos, issues, and PRs through the GitHub MCP server.",
    category: "remote",
    icon: "globe",
    popular: true,
    server: {
      id: "github",
      kind: "stdio",
      enabled: true,
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      label: "GitHub",
      authHeaderEnv: "GITHUB_PERSONAL_ACCESS_TOKEN",
    },
  },
  {
    id: "pack:postgres",
    title: "PostgreSQL",
    description: "Query a Postgres database from the agent (stdio MCP).",
    category: "local",
    icon: "circle-stack",
    server: {
      id: "postgres",
      kind: "stdio",
      enabled: true,
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-postgres"],
      label: "PostgreSQL",
    },
  },
  {
    id: "pack:brave-search",
    title: "Brave Search",
    description:
      "Optional paid Brave Search API MCP. Prefer built-in web.search + local SearXNG (pnpm searxng:dev) — no API key.",
    category: "remote",
    icon: "globe",
    server: {
      id: "brave-search",
      kind: "stdio",
      enabled: true,
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-brave-search"],
      label: "Brave Search",
      authHeaderEnv: "BRAVE_API_KEY",
    },
  },
  {
    id: "pack:puppeteer",
    title: "Puppeteer",
    description: "Browse and screenshot pages with a headless browser MCP.",
    category: "automation",
    icon: "cog",
    server: {
      id: "puppeteer",
      kind: "stdio",
      enabled: true,
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-puppeteer"],
      label: "Puppeteer",
    },
  },
  {
    id: "pack:sqlite",
    title: "SQLite",
    description: "Local SQLite database access for structured project data.",
    category: "local",
    icon: "circle-stack",
    server: {
      id: "sqlite",
      kind: "stdio",
      enabled: true,
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-sqlite"],
      label: "SQLite",
    },
  },
  {
    id: "pack:dbhub-d1",
    title: "DBHub (D1 Studio)",
    description:
      "Token-efficient SQL MCP for the project D1 stand-in (.data/primary-d1.sqlite). Pair with the Data window table browser.",
    category: "local",
    icon: "circle-stack",
    popular: true,
    server: {
      id: "dbhub-d1",
      kind: "stdio",
      enabled: true,
      command: "npx",
      args: dbhubStdioNpxArgs({ dsn: DBHUB_D1_DSN, id: "studio-d1" }),
      label: "DBHub D1",
    },
  },
  {
    id: "pack:slack",
    title: "Slack",
    description: "Post and read Slack channels when the Slack MCP is configured.",
    category: "other",
    icon: "chat",
    server: {
      id: "slack",
      kind: "stdio",
      enabled: true,
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-slack"],
      label: "Slack",
      authHeaderEnv: "SLACK_BOT_TOKEN",
    },
  },
  {
    id: "pack:fetch",
    title: "Fetch",
    description: "HTTP fetch utility for APIs and public URLs.",
    category: "remote",
    icon: "cloud",
    popular: true,
    server: {
      id: "fetch",
      kind: "stdio",
      enabled: true,
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-fetch"],
      label: "Fetch",
    },
  },
  {
    id: "pack:time",
    title: "Time",
    description: "Time and timezone helpers for scheduling-aware agents.",
    category: "other",
    icon: "cog",
    server: {
      id: "time",
      kind: "stdio",
      enabled: true,
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-time"],
      label: "Time",
    },
  },
];

function categoryForServer(s: StudioMcpServerConfig): McpDirectoryEntry["category"] {
  const id = s.id.toLowerCase();
  if (id.includes("n8n") || id.includes("zapier") || id.includes("puppeteer")) {
    return "automation";
  }
  if (id.includes("studio")) return "studio";
  if (s.kind === "stdio" && (id.includes("file") || id.includes("sqlite") || id.includes("postgres"))) {
    return "local";
  }
  if (s.kind === "http" || id.includes("github") || id.includes("brave") || id.includes("fetch")) {
    return "remote";
  }
  if (s.kind === "stdio") return "local";
  return "other";
}

function iconForServer(s: StudioMcpServerConfig): McpDirectoryIconId {
  const id = s.id.toLowerCase();
  if (id.includes("n8n") || id.includes("bolt")) return "bolt";
  if (id.includes("file")) return "folder";
  if (id.includes("studio")) return "server";
  if (id.includes("slack") || id.includes("chat")) return "chat";
  if (id.includes("postgres") || id.includes("sqlite") || id.includes("memory")) {
    return "circle-stack";
  }
  if (id.includes("github") || id.includes("brave") || id.includes("globe")) return "globe";
  if (s.kind === "stdio") return "command-line";
  if (s.kind === "http") return "cloud";
  return "puzzle";
}

/**
 * Merge live config.servers with catalog packs.
 * Connected servers win; catalog fills available slots.
 */
export function buildMcpDirectoryEntries(
  servers: readonly StudioMcpServerConfig[],
): McpDirectoryEntry[] {
  const byServerId = new Map(servers.map((s) => [s.id, s]));
  const used = new Set<string>();
  const out: McpDirectoryEntry[] = [];

  for (const cat of MCP_DIRECTORY_CATALOG) {
    const live = byServerId.get(cat.server.id);
    if (live) {
      used.add(live.id);
      out.push({
        ...cat,
        title: live.label ?? cat.title,
        description: cat.description,
        status: live.enabled === false ? "disabled" : "connected",
        server: live,
      });
    } else {
      out.push({ ...cat, status: "available" });
    }
  }

  for (const s of servers) {
    if (used.has(s.id)) continue;
    out.push({
      id: `connected:${s.id}`,
      title: s.label ?? s.id,
      description: [
        s.kind,
        s.url,
        s.command,
        s.enabled === false ? "disabled" : null,
      ]
        .filter(Boolean)
        .join(" · "),
      category: categoryForServer(s),
      icon: iconForServer(s),
      status: s.enabled === false ? "disabled" : "connected",
      server: s,
    });
  }

  return out;
}

export function matchMcpDirectoryCategory(
  entry: IntegrationsDirectoryEntry,
  categoryId: string,
): boolean {
  const id = categoryId.toLowerCase();
  if (id === "project") return entry.entryKind === "project";
  if (entry.entryKind === "project") return false;
  if (id === "connected") {
    return entry.status === "connected" || entry.status === "disabled";
  }
  if (id === "popular") return entry.popular === true;
  return entry.category === id;
}

export function buildProjectIntegrationsDirectoryEntries(
  rows: readonly ProjectIntegrationConfigRow[],
): ProjectIntegrationsDirectoryEntry[] {
  return rows.map((row) => ({
    id: `project:${row.id}`,
    title: row.id,
    description: `Project file · ${String(row.config.kind ?? "—")} · ${row.path}`,
    category: "project",
    icon: "puzzle",
    status: "connected",
    entryKind: "project",
    path: row.path,
    config: row.config,
  }));
}

/**
 * One directory: MCP catalog/servers + optional project integrations/*.json.
 * Filter `project` shows only project configs; other filters exclude them.
 */
export function queryMcpDirectory(input: {
  servers: readonly StudioMcpServerConfig[];
  category: string;
  search: string;
  page: number;
  pageSize?: number;
  projectConfigs?: readonly ProjectIntegrationConfigRow[];
}): DirectoryPageResult<IntegrationsDirectoryEntry> {
  const mcp = buildMcpDirectoryEntries(input.servers).map((e) => ({
    ...e,
    entryKind: "mcp" as const,
  }));
  const project = buildProjectIntegrationsDirectoryEntries(
    input.projectConfigs ?? [],
  );
  const all: IntegrationsDirectoryEntry[] = [...mcp, ...project];
  const byCat = filterDirectoryByCategory(
    all,
    input.category || "popular",
    matchMcpDirectoryCategory,
  );
  const filtered = filterDirectoryByQuery(byCat, input.search, (e) => [
    e.title,
    e.description,
    e.entryKind === "project" ? e.path : e.server.id,
    e.category,
  ]);
  return paginateDirectory(
    filtered,
    input.page,
    input.pageSize ?? MCP_DIRECTORY_PAGE_SIZE,
  );
}

export const DEFAULT_MCP_DIRECTORY_CATEGORY: McpDirectoryCategoryId = "popular";
