/**
 * One-click MCP server presets — attach into config.mcp.servers (not a marketplace).
 */

import type { StudioMcpServerConfig } from "./studio-config-pure.js";
import {
  buildDbhubSqliteDsn,
  dbhubStdioNpxArgs,
  defaultDbhubD1StandInPath,
} from "./dbhub-dsn-pure.js";

export type McpStarterPack = {
  id: string;
  label: string;
  description: string;
  server: StudioMcpServerConfig;
};

/** Default D1 stand-in DSN for the template primary-d1 destination (project cwd). */
const DEFAULT_DBHUB_D1_DSN = buildDbhubSqliteDsn(
  defaultDbhubD1StandInPath("primary-d1"),
);

export const MCP_STARTER_PACKS: readonly McpStarterPack[] = [
  {
    id: "n8n-local",
    label: "n8n (hosted)",
    description: "Hosted n8n MCP (workflows.auth.…site) — set N8N_MCP_TOKEN",
    server: {
      id: "n8n-local",
      kind: "http",
      enabled: true,
      url: "https://workflows.auth.glassboxcomputer.site/mcp-server/http",
      label: "n8n MCP (hosted)",
      authHeaderEnv: "N8N_MCP_TOKEN",
    },
  },
  {
    id: "filesystem-stdio",
    label: "Filesystem (stdio)",
    description: "Official filesystem MCP via npx (cwd = project when used)",
    server: {
      id: "filesystem",
      kind: "stdio",
      enabled: true,
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "."],
      label: "Filesystem",
    },
  },
  {
    id: "dbhub-d1",
    label: "DBHub (D1 / SQLite)",
    description:
      "DBHub MCP on project .data/primary-d1.sqlite — run with project cwd; swap DSN for other destinations",
    server: {
      id: "dbhub-d1",
      kind: "stdio",
      enabled: true,
      command: "npx",
      args: dbhubStdioNpxArgs({ dsn: DEFAULT_DBHUB_D1_DSN, id: "studio-d1" }),
      label: "DBHub D1",
    },
  },
  {
    id: "studio-http",
    label: "Studio HTTP twin",
    description: "This Studio API as MCP (:3847) — usually already present",
    server: {
      id: "studio-http",
      kind: "http",
      enabled: true,
      url: "http://127.0.0.1:3847",
      label: "Studio HTTP twin",
    },
  },
];

/** Merge pack server into list (replace same id). */
export function applyMcpStarterPack(
  servers: readonly StudioMcpServerConfig[],
  packId: string,
): StudioMcpServerConfig[] | null {
  const pack = MCP_STARTER_PACKS.find((p) => p.id === packId);
  if (!pack) return null;
  const next = servers.filter((s) => s.id !== pack.server.id);
  next.push({ ...pack.server });
  return next;
}
