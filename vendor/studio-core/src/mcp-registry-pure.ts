/**
 * Official MCP Registry entry → Studio mcp.servers attach shape (pure).
 * Registry: https://registry.modelcontextprotocol.io
 */

import type { StudioMcpServerConfig } from "./studio-config-pure.js";

export type McpRegistryPackage = {
  name: string;
  title?: string;
  description?: string;
  /** Suggested Studio server id (sanitized). */
  suggestedId: string;
};

export type McpRegistryRemote = {
  type?: string;
  url?: string;
};

export type McpRegistryServerDetail = {
  name: string;
  title?: string;
  description?: string;
  remotes?: McpRegistryRemote[];
  packages?: Array<{
    registryType?: string;
    identifier?: string;
    transport?: { type?: string };
    runtimeHint?: string;
    packageArguments?: Array<{ value?: string }>;
    environmentVariables?: Array<{ name?: string; description?: string }>;
  }>;
};

/** Sanitize registry name → studio server id. */
export function mcpRegistrySuggestedId(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/^io\.github\./, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base.slice(0, 64) || "mcp-server";
}

/** Parse list/search JSON from registry into lightweight rows. */
export function parseMcpRegistrySearchPayload(raw: unknown): McpRegistryPackage[] {
  if (!raw || typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;
  const servers = Array.isArray(o.servers)
    ? o.servers
    : Array.isArray(o)
      ? o
      : [];
  const out: McpRegistryPackage[] = [];
  for (const item of servers) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const server =
      row.server && typeof row.server === "object"
        ? (row.server as Record<string, unknown>)
        : row;
    const name =
      typeof server.name === "string"
        ? server.name
        : typeof row.name === "string"
          ? row.name
          : "";
    if (!name.trim()) continue;
    out.push({
      name: name.trim(),
      title:
        typeof server.title === "string"
          ? server.title
          : typeof row.title === "string"
            ? row.title
            : undefined,
      description:
        typeof server.description === "string"
          ? server.description
          : typeof row.description === "string"
            ? row.description
            : undefined,
      suggestedId: mcpRegistrySuggestedId(name),
    });
  }
  return out;
}

/**
 * Prefer streamable-http / sse remote URL; else first npm package as stdio npx.
 */
export function studioServerFromRegistryDetail(
  detail: McpRegistryServerDetail,
  opts?: { id?: string },
): StudioMcpServerConfig | null {
  const id = (opts?.id ?? mcpRegistrySuggestedId(detail.name)).trim();
  if (!id) return null;

  const remotes = detail.remotes ?? [];
  for (const r of remotes) {
    const url = typeof r.url === "string" ? r.url.trim() : "";
    if (!url) continue;
    return {
      id,
      kind: "http",
      enabled: true,
      url,
      label: detail.title ?? detail.name,
    };
  }

  const pkgs = detail.packages ?? [];
  for (const p of pkgs) {
    const identifier =
      typeof p.identifier === "string" ? p.identifier.trim() : "";
    if (!identifier) continue;
    const registryType = (p.registryType ?? "").toLowerCase();
    if (registryType && registryType !== "npm" && registryType !== "oci") {
      continue;
    }
    const extraArgs = (p.packageArguments ?? [])
      .map((a) => (typeof a.value === "string" ? a.value : ""))
      .filter(Boolean);
    const authEnv = p.environmentVariables?.find(
      (e) => typeof e.name === "string" && e.name.trim(),
    );
    return {
      id,
      kind: "stdio",
      enabled: true,
      command: "npx",
      args: ["-y", identifier, ...extraArgs],
      label: detail.title ?? detail.name,
      authHeaderEnv:
        authEnv && typeof authEnv.name === "string"
          ? authEnv.name.trim()
          : undefined,
    };
  }

  return null;
}

/** Parse GET /v0/servers/{name} (or wrapped) body. */
export function parseMcpRegistryServerDetail(raw: unknown): McpRegistryServerDetail | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const server =
    o.server && typeof o.server === "object"
      ? (o.server as Record<string, unknown>)
      : o;
  const name = typeof server.name === "string" ? server.name.trim() : "";
  if (!name) return null;
  return {
    name,
    title: typeof server.title === "string" ? server.title : undefined,
    description:
      typeof server.description === "string" ? server.description : undefined,
    remotes: Array.isArray(server.remotes)
      ? (server.remotes as McpRegistryRemote[])
      : undefined,
    packages: Array.isArray(server.packages)
      ? (server.packages as McpRegistryServerDetail["packages"])
      : undefined,
  };
}
