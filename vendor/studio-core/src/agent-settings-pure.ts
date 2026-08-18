/**
 * Agent settings — which MCP tools are enabled (default: all, including writes).
 */

import {
  STUDIO_TOOL_CATALOG,
  type ToolActionId,
} from "./tool-catalog-pure.js";

export type AgentToolSettings = {
  /** Tool id → enabled. Missing key = enabled (default write access on). */
  tools: Partial<Record<ToolActionId, boolean>>;
};

export function defaultAgentToolSettings(): AgentToolSettings {
  const tools: Partial<Record<ToolActionId, boolean>> = {};
  for (const t of STUDIO_TOOL_CATALOG) {
    tools[t.id] = true;
  }
  return { tools };
}

export function isToolEnabled(
  settings: AgentToolSettings,
  id: ToolActionId,
): boolean {
  return settings.tools[id] !== false;
}

/** Allowlist for harness; null = all catalog tools. */
export function allowToolsFromSettings(
  settings: AgentToolSettings,
): readonly string[] | null {
  const enabled = STUDIO_TOOL_CATALOG.filter((t) =>
    isToolEnabled(settings, t.id),
  ).map((t) => t.id);
  if (enabled.length === STUDIO_TOOL_CATALOG.length) return null;
  return enabled;
}

/** Intersect mode allowlist with settings (null mode = all). */
export function mergeToolAllowlists(
  modeAllow: readonly string[] | null | undefined,
  settingsAllow: readonly string[] | null | undefined,
): readonly string[] | null {
  if (modeAllow && modeAllow.length === 0) return [];
  if (settingsAllow && settingsAllow.length === 0) return [];
  if (modeAllow == null && settingsAllow == null) return null;
  if (modeAllow == null) return settingsAllow ?? null;
  if (settingsAllow == null) return modeAllow;
  const set = new Set(settingsAllow);
  return modeAllow.filter((id) => set.has(id));
}

export function setToolEnabled(
  settings: AgentToolSettings,
  id: ToolActionId,
  enabled: boolean,
): AgentToolSettings {
  return {
    tools: { ...settings.tools, [id]: enabled },
  };
}
