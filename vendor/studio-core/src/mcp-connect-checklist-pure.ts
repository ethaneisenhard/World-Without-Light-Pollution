/**
 * Hermes-style Connect checklist: seed selected tools → toggle → apply include.
 */

import type { StudioMcpServerConfig } from "./studio-config-pure.js";

export type McpConnectToolRow = {
  name: string;
  description?: string;
};

/** Seed: prior include ∩ discovered, else all discovered names. */
export function seedMcpConnectSelected(
  tools: readonly McpConnectToolRow[],
  priorInclude?: readonly string[] | null,
): string[] {
  const names = tools.map((t) => t.name).filter(Boolean);
  if (!priorInclude?.length) return [...names];
  const discovered = new Set(names);
  const kept = priorInclude.filter((n) => discovered.has(n));
  return kept.length ? kept : [...names];
}

export function toggleMcpConnectTool(
  selected: readonly string[],
  name: string,
): string[] {
  const n = name.trim();
  if (!n) return [...selected];
  if (selected.includes(n)) return selected.filter((x) => x !== n);
  return [...selected, n];
}

/**
 * Patch server with tools.include + optionally enable.
 * Selecting every discovered tool → omit include (clean Hermes shape).
 */
export function applyMcpConnectToolsInclude(
  server: StudioMcpServerConfig,
  selected: readonly string[],
  options?: { enable?: boolean; discoveredCount?: number },
): StudioMcpServerConfig {
  const names = [...new Set(selected.map((s) => s.trim()).filter(Boolean))];
  const enable = options?.enable !== false;
  const allSelected =
    options?.discoveredCount != null &&
    names.length > 0 &&
    names.length >= options.discoveredCount;

  let tools = server.tools ? { ...server.tools } : undefined;
  if (names.length === 0 || allSelected) {
    if (tools) {
      const { include: _drop, ...rest } = tools;
      tools = Object.keys(rest).length ? rest : undefined;
    }
  } else {
    tools = { ...(tools ?? {}), include: names };
  }

  return {
    ...server,
    enabled: enable ? true : server.enabled,
    ...(tools ? { tools } : { tools: undefined }),
  };
}
