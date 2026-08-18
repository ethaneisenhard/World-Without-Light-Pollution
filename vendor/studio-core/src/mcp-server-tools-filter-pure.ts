/**
 * Per-server MCP tool filter (Hermes tools.include / exclude).
 * Include wins when both are set. Exact names v1 (no globs).
 */

import type { StudioMcpServerToolsConfig } from "./studio-config-pure.js";

export type McpToolNameRow = {
  name: string;
  description?: string;
};

/**
 * Filter discovered tools by server `tools` policy.
 * - `include` present (non-empty) → only those names
 * - else `exclude` → drop matching names
 * - else passthrough
 */
export function filterMcpServerTools(
  tools: readonly McpToolNameRow[],
  policy: StudioMcpServerToolsConfig | null | undefined,
): McpToolNameRow[] {
  if (!policy) return [...tools];
  const include = policy.include?.map((s) => s.trim()).filter(Boolean) ?? [];
  if (include.length > 0) {
    const want = new Set(include);
    return tools.filter((t) => want.has(t.name));
  }
  const exclude = policy.exclude?.map((s) => s.trim()).filter(Boolean) ?? [];
  if (exclude.length === 0) return [...tools];
  const drop = new Set(exclude);
  return tools.filter((t) => !drop.has(t.name));
}

/** Whether a single tool name is allowed under policy. */
export function mcpServerToolAllowed(
  name: string,
  policy: StudioMcpServerToolsConfig | null | undefined,
): boolean {
  return filterMcpServerTools([{ name }], policy).length === 1;
}
