/**
 * Guarded vs All-access Studio — resolve effective tool allowlist.
 * Guard barrels stay in code; All-access skips config/project allowlists + approvals.
 */

import type { ChatComposerMode } from "./chat-mode-pure.js";
import { allowToolsForChatMode, effectiveChatMode } from "./chat-mode-pure.js";
import { intersectAllowlists } from "./context-bundle-pure.js";
import { parseGlobalFilePath } from "./global-file-access-pure.js";
import type { StudioConfig } from "./studio-config-pure.js";
import { allowToolsFromStudioConfig } from "./studio-config-pure.js";
import { HARNESS_PROGRESSIVE_TOOL_IDS } from "./tool-catalog-pure.js";

export type AccessMode = "guarded" | "all";

/** Project/user override: inherit studio default, or force. */
export type AccessModeOverride = AccessMode | "inherit";

export function parseAccessMode(raw: unknown): AccessMode {
  if (raw === "all") return "all";
  return "guarded";
}

export function parseAccessModeOverride(raw: unknown): AccessModeOverride {
  if (raw === "all" || raw === "guarded" || raw === "inherit") return raw;
  if (raw === null || raw === undefined) return "inherit";
  return "inherit";
}

/**
 * Most-specific wins: user → project → studio.
 * `inherit` / undefined at a layer skips that layer.
 */
export function resolveAccessMode(input: {
  studio?: AccessMode | null;
  project?: AccessModeOverride | null;
  user?: AccessModeOverride | null;
}): AccessMode {
  const user = input.user;
  if (user === "all" || user === "guarded") return user;
  const project = input.project;
  if (project === "all" || project === "guarded") return project;
  return input.studio === "all" ? "all" : "guarded";
}

/**
 * Effective tool allowlist for a chat turn.
 * - All-access: skip studio mcp.tools + project allowTools (catalog open).
 * - Guarded: ∩ of those layers.
 * - Chat mode (Ask/Plan) always applies — intentional UX, not a security toggle.
 * - requestAllow is still ∩ (caller can narrow further).
 * - Agent always unions progressive meta tools so tools.search/call work even when
 *   project harness.json lists only concrete actions.
 */
export function resolveEffectiveAllowTools(input: {
  accessMode: AccessMode;
  studioConfig: StudioConfig;
  projectAllowTools?: readonly string[] | null;
  chatMode: ChatComposerMode;
  requestAllowTools?: readonly string[] | null;
}): readonly string[] | null {
  const modeAllow = allowToolsForChatMode(input.chatMode);
  const base =
    input.accessMode === "all"
      ? intersectAllowlists(modeAllow, input.requestAllowTools ?? null)
      : intersectAllowlists(
          allowToolsFromStudioConfig(input.studioConfig),
          input.projectAllowTools,
          modeAllow,
          input.requestAllowTools ?? null,
        );
  return ensureProgressiveMetaTools(base, input.chatMode);
}

/** Union progressive bridge tools into a concrete allowlist (Agent/Plan). */
export function ensureProgressiveMetaTools(
  allow: readonly string[] | null,
  chatMode: ChatComposerMode,
): readonly string[] | null {
  if (allow === null) return null;
  const eff = effectiveChatMode(chatMode);
  if (eff === "ask") return allow;
  const need =
    eff === "plan"
      ? (["tools.search", "tools.describe"] as const)
      : HARNESS_PROGRESSIVE_TOOL_IDS;
  const set = new Set(allow);
  for (const id of need) set.add(id);
  return [...set];
}

/** Push/deploy skip approval queue when All-access. */
export function approvalsRequiredForAccessMode(mode: AccessMode): boolean {
  return mode !== "all";
}

/**
 * Phrases that mean Full computer access (Settings → AI / chat levers).
 * Includes "full computer access" (word between full + access).
 */
const FULL_COMPUTER_ACCESS_RE =
  /\b(?:full(?:\s+computer)?\s+access|complete\s+computer\s+access|computer\s+override|all[\s-]?access|unguarded|access\s+mode\s+all|all[\s-]?access\s+mode)\b/i;

/**
 * Deterministic chat intent — "full access" / "full computer access" / "switch to guarded".
 * Kept for tests / helpers — chat SSE must **not** auto-exec before harness.
 */
export function parseAccessModeChatIntent(
  text: string,
): { mode: AccessMode; label: string } | null {
  const t = text.trim();
  if (!t || t.length > 200) return null;
  const wantsAll = FULL_COMPUTER_ACCESS_RE.test(t);
  const wantsGuarded =
    /\b(guarded|safe\s+mode|restrict(?:ed)?\s+access|access\s+mode\s+guarded)\b/i.test(
      t,
    ) && !wantsAll;
  // Require an explicit mode phrase — not "turn on" alone.
  if (!wantsAll && !wantsGuarded) return null;

  if (wantsAll) {
    return { mode: "all", label: "full computer access" };
  }
  return { mode: "guarded", label: "guarded" };
}

/**
 * Config patch when the user picks Full computer access vs Guarded.
 * Full access also turns NOPE off so shell.run can install CLIs / touch system.
 * Guarded restores balanced NOPE (Settings → Security can still customize).
 */
export function studioConfigPatchForAccessMode(mode: AccessMode): {
  ai: { accessMode: AccessMode };
  security: { nope: { posture: "off" | "balanced" } };
} {
  return {
    ai: { accessMode: mode },
    security: {
      nope: { posture: mode === "all" ? "off" : "balanced" },
    },
  };
}

/**
 * Prefix for monorepo (Studio source) file ops from Global chat (default)
 * or All-access project turns when repoRoot is set.
 * `files.read` path `@studio/apps/studio/client/app.tsx` → repoRoot-relative.
 * Parse SoT: `parseGlobalFilePath` (bare `@studio` + `@studio/…`).
 */
export const STUDIO_MONOREPO_PATH_PREFIX = "@studio/";

export function parseStudioMonorepoFilePath(
  filePath: string,
): { kind: "studio"; rel: string } | { kind: "project"; path: string } {
  const parsed = parseGlobalFilePath(filePath);
  if (parsed.kind === "studio") {
    return { kind: "studio", rel: parsed.rel };
  }
  return { kind: "project", path: filePath.trim() };
}
