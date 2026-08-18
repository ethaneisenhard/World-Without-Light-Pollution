/**
 * ContextBundle tiers — peer-minimal vs studio-full (thin shell).
 */

import { BUILTIN_HARNESS_IDS } from "./harness-policy-pure.js";
import { isApiToolLoopHarness } from "./harness-turn-kind-pure.js";

export type HarnessContextTier = "peer-minimal" | "studio-full";

/** API tool-loop harnesses get full inject; CLI peers minimal. */
export function harnessContextTier(harnessId: string): HarnessContextTier {
  const id = harnessId.trim() || BUILTIN_HARNESS_IDS.anthropic;
  if (isApiToolLoopHarness(id)) {
    return "studio-full";
  }
  return "peer-minimal";
}

/**
 * Filter Host system parts by tier.
 * peer-minimal: keep only viewport UI context (+ optional short MCP fact).
 * studio-full: keep all non-empty parts.
 */
export function selectContextSystemParts(input: {
  tier: HarnessContextTier;
  /** Viewport / UI context from the client (formatStudioChatContext). */
  viewportContext?: string | null;
  /** Optional MCP status fact for peers (prefer studioMcpStatusFact). */
  mcpFact?: string | null;
  /** Full inject parts (viewport, rules, skills, memory, notes, …). */
  fullParts: readonly (string | null | undefined)[];
}): string[] {
  if (input.tier === "studio-full") {
    return input.fullParts.map((p) => p?.trim() ?? "").filter(Boolean);
  }
  const out: string[] = [];
  const viewport = input.viewportContext?.trim();
  if (viewport) out.push(viewport);
  const mcp = input.mcpFact?.trim();
  if (mcp) out.push(mcp);
  return out;
}
