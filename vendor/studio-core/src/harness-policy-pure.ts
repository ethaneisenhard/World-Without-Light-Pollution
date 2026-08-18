/**
 * Project harness.json policy — parse, migrate, resolve which harness runs a turn.
 * Pure: no fs / fetch. Orchestrators load JSON then call these.
 *
 * Product surface: Studio is the shell (MCP / chrome / spawn). Composer picks peer
 * harnesses + Anthropic Claude API. Legacy id `studio` aliases → `anthropic`.
 */

import {
  parseAccessModeOverride,
  type AccessModeOverride,
} from "./access-mode-pure.js";
import {
  isAgentRoomHarnessId,
} from "./agent-room-id-pure.js";

export const BUILTIN_HARNESS_IDS = {
  /**
   * Legacy alias for the Claude Messages API path.
   * Not shown in the composer; normalize to `anthropic`.
   */
  studio: "studio",
  /** Claude Messages API + progressive Studio MCP tools (API harness). */
  anthropic: "anthropic",
  /** DeepSeek Chat Completions API (Host-owned progressive tool loop). */
  deepseek: "deepseek",
  /** Self-hosted LiteLLM gateway (OpenAI-compat Chat Completions tool loop). */
  litellm: "litellm",
  cursor: "cursor",
  kody: "kody",
  hermes: "hermes",
  grok: "grok",
} as const;

export const REGISTERED_HARNESS_IDS = [
  BUILTIN_HARNESS_IDS.studio,
  BUILTIN_HARNESS_IDS.anthropic,
  BUILTIN_HARNESS_IDS.deepseek,
  BUILTIN_HARNESS_IDS.litellm,
  BUILTIN_HARNESS_IDS.cursor,
  BUILTIN_HARNESS_IDS.kody,
  BUILTIN_HARNESS_IDS.hermes,
  BUILTIN_HARNESS_IDS.grok,
] as const;

/**
 * Harness ids shown in the composer / Settings default picker.
 * Agent room = Multitask substrate (not a peer pick).
 * `studio` = legacy alias — not listed; use `anthropic`.
 */
export const COMPOSER_HARNESS_IDS = [
  BUILTIN_HARNESS_IDS.cursor,
  BUILTIN_HARNESS_IDS.anthropic,
  BUILTIN_HARNESS_IDS.deepseek,
  BUILTIN_HARNESS_IDS.litellm,
  BUILTIN_HARNESS_IDS.hermes,
  BUILTIN_HARNESS_IDS.grok,
] as const;

/** Legacy `studio` → `anthropic`. */
export function normalizeHarnessIdAlias(harnessId: string): string {
  const id = harnessId.trim();
  if (id === BUILTIN_HARNESS_IDS.studio) {
    return BUILTIN_HARNESS_IDS.anthropic;
  }
  return id;
}

function normalizeAllowedHarnesses(
  allowed: string[] | null | undefined,
): string[] | null {
  if (allowed == null) return allowed ?? null;
  if (allowed.length === 0) return allowed;
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of allowed) {
    const id = normalizeHarnessIdAlias(raw);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  // API-class sibling: projects that allow Anthropic also allow DeepSeek.
  // Avoids stale harness.json rejecting a first-class composer harness.
  if (
    seen.has(BUILTIN_HARNESS_IDS.anthropic) &&
    !seen.has(BUILTIN_HARNESS_IDS.deepseek)
  ) {
    out.push(BUILTIN_HARNESS_IDS.deepseek);
  }
  return out;
}

/** Claude Messages API path — accepts legacy `studio` and product `anthropic`. */
export function isAnthropicMessagesHarness(harnessId: string): boolean {
  const id = normalizeHarnessIdAlias(harnessId);
  return id === BUILTIN_HARNESS_IDS.anthropic;
}

/**
 * @deprecated Prefer `isApiToolLoopHarness` / `apiToolLoopTransport` from harness-turn-kind-pure.
 * Kept for call sites that need DeepSeek-specific checks.
 */
export function isDeepseekApiHarness(harnessId: string): boolean {
  return harnessId.trim() === BUILTIN_HARNESS_IDS.deepseek;
}

/** LiteLLM gateway harness (chat-completions via LITELLM_BASE_URL). */
export function isLitellmGatewayHarness(harnessId: string): boolean {
  return harnessId.trim() === BUILTIN_HARNESS_IDS.litellm;
}

export type ProjectHarnessPolicy = {
  /** 1 = flat allowTools; 2 = optional allowedHarnesses list */
  version: 1 | 2;
  defaultHarness?: string;
  /** null = clear / inherit global; undefined = omit from file */
  allowTools?: string[] | null;
  /** null = any registered harness; list = project allowlist */
  allowedHarnesses: string[] | null;
  /** Inherit studio ai.accessMode, or force guarded/all for this project. */
  accessMode: AccessModeOverride;
};

function asStringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out = value.filter((t): t is string => typeof t === "string" && t.trim().length > 0);
  return out;
}

/**
 * Accepts runtime shapes:
 * - `{ defaultHarness, allowTools }`
 * - `{ defaultHarness, tools: { allow } }` (docs / older examples)
 * - `{ version: 2, allowedHarnesses }`
 *
 * Migrates legacy `defaultHarness` / allowlist id `studio` → `anthropic`.
 */
export function parseProjectHarnessPolicy(raw: unknown): ProjectHarnessPolicy {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return {
      version: 1,
      defaultHarness: undefined,
      allowTools: undefined,
      allowedHarnesses: null,
      accessMode: "inherit",
    };
  }
  const o = raw as Record<string, unknown>;
  const version = o.version === 2 ? 2 : 1;

  let allowTools: string[] | null | undefined;
  if (Array.isArray(o.allowTools) || o.allowTools === null) {
    allowTools =
      o.allowTools === null ? null : asStringList(o.allowTools) ?? [];
  } else if (
    typeof o.tools === "object" &&
    o.tools !== null &&
    !Array.isArray(o.tools)
  ) {
    const tools = o.tools as Record<string, unknown>;
    const nested = asStringList(tools.allow);
    if (nested) allowTools = nested;
  }

  const allowed = asStringList(o.allowedHarnesses);
  const rawDefault =
    typeof o.defaultHarness === "string" && o.defaultHarness.trim()
      ? o.defaultHarness.trim()
      : undefined;

  return {
    version,
    defaultHarness: rawDefault
      ? normalizeHarnessIdAlias(rawDefault)
      : undefined,
    allowTools,
    allowedHarnesses: normalizeAllowedHarnesses(allowed ?? null),
    accessMode: parseAccessModeOverride(o.accessMode),
  };
}

/** Serialize policy for harness.json (canonical flat allowTools). */
export function serializeProjectHarnessPolicy(
  policy: ProjectHarnessPolicy,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (policy.version === 2) out.version = 2;
  if (policy.defaultHarness) {
    out.defaultHarness = normalizeHarnessIdAlias(policy.defaultHarness);
  }
  if (policy.allowTools !== undefined) out.allowTools = policy.allowTools;
  const allowed = normalizeAllowedHarnesses(policy.allowedHarnesses);
  if (allowed?.length) {
    out.allowedHarnesses = allowed;
  }
  if (policy.accessMode && policy.accessMode !== "inherit") {
    out.accessMode = policy.accessMode;
  }
  return out;
}

export type ResolveHarnessIdInput = {
  requested?: string | null;
  projectDefault?: string | null;
  globalDefault?: string | null;
  allowedHarnesses?: string[] | null;
};

export type ResolveHarnessIdResult =
  | { ok: true; harnessId: string }
  | { ok: false; error: string };

/**
 * requested → project default → global default → builtin cursor.
 * Legacy `studio` normalizes to `anthropic`.
 * When allowedHarnesses is a non-empty list, chosen id must be in it (after alias).
 */
export function resolveHarnessId(
  input: ResolveHarnessIdInput,
): ResolveHarnessIdResult {
  const raw =
    (input.requested?.trim() || null) ??
    (input.projectDefault?.trim() || null) ??
    (input.globalDefault?.trim() || null) ??
    BUILTIN_HARNESS_IDS.cursor;

  const candidate = normalizeHarnessIdAlias(raw);
  const allowed = normalizeAllowedHarnesses(input.allowedHarnesses);
  if (allowed && allowed.length > 0 && !allowed.includes(candidate)) {
    return {
      ok: false,
      error: `Harness "${candidate}" is not allowed for this project`,
    };
  }
  return { ok: true, harnessId: candidate };
}

/**
 * Coerce composer / settings harness pick.
 * Empty or Agent room presence id → cursor (product default).
 * Legacy studio → anthropic. Unknown ids → cursor.
 */
export function coerceComposerHarnessId(id: string | undefined | null): string {
  const t = (id ?? "").trim();
  if (!t || isAgentRoomHarnessId(t)) {
    return BUILTIN_HARNESS_IDS.cursor;
  }
  const normalized = normalizeHarnessIdAlias(t);
  // Kody is MCP plane now — never a composer harness face.
  if (normalized === BUILTIN_HARNESS_IDS.kody) {
    return BUILTIN_HARNESS_IDS.cursor;
  }
  if ((COMPOSER_HARNESS_IDS as readonly string[]).includes(normalized)) {
    return normalized;
  }
  return BUILTIN_HARNESS_IDS.cursor;
}

/**
 * Harness id for composer face + model catalog + send.
 * Never paint a different id than the coerced/allowed pick (legacy `studio`
 * falling through to choices[0] while state stayed `studio` → Cursor face +
 * Anthropic models/send).
 */
export function resolveComposerHarnessForPicker(
  chatHarness: string | undefined | null,
  harnessChoices: readonly string[],
): string {
  const coerced = coerceComposerHarnessId(chatHarness);
  const choices = harnessChoices.filter((id) => !isAgentRoomHarnessId(id));
  if (choices.includes(coerced)) return coerced;
  return choices[0] ?? BUILTIN_HARNESS_IDS.cursor;
}
