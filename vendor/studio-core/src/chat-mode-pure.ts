/**
 * Chat composer modes — Agent / Plan / Ask / Debug / Multitask / Workflow.
 * Ask/Plan narrow tools; Debug keeps full tools with a diagnosis contract;
 * Multitask → Agent rooms (presence / spawn — not a harness pick).
 * Workflow → DurableRuntime / n8n deploy path (composer Send starts a run, not a live turn).
 * Peer CLI harnesses get the same mode hint via `appendChatModeContext`.
 */

import {
  STUDIO_TOOL_CATALOG,
  type ToolActionId,
} from "./tool-catalog-pure.js";
import type { MultiAgentSetting } from "./agent-room-id-pure.js";
import { isSingleAgentGithubJob } from "./github-clone-target-pure.js";

export type { MultiAgentSetting } from "./agent-room-id-pure.js";

export type ChatComposerMode =
  | "agent"
  | "plan"
  | "ask"
  | "debug"
  | "multitask"
  | "workflow";

export const CHAT_COMPOSER_MODES: readonly ChatComposerMode[] = [
  "agent",
  "plan",
  "ask",
  "debug",
  "multitask",
  "workflow",
] as const;

export const CHAT_MODE_LABELS: Record<ChatComposerMode, string> = {
  agent: "Agent",
  plan: "Plan",
  ask: "Ask",
  debug: "Debug",
  multitask: "Multitask",
  workflow: "Workflow",
};

/**
 * Never override the picker harness. Multitask is Agent rooms (presence),
 * not a brain called `agent-room`.
 */
export function harnessOverrideForChatMode(_input: {
  mode: ChatComposerMode;
  multiAgent?: MultiAgentSetting | string | null;
}): string | null {
  return null;
}

/**
 * Desk Host still maps Multitask → Electric stub. Clone / GitHub jobs
 * always send Agent so the real harness runs.
 */
export function resolveChatSendMode(
  mode: ChatComposerMode,
  userText: string,
): ChatComposerMode {
  if (!isSingleAgentGithubJob(userText)) return mode;
  switch (mode) {
    case "multitask":
    case "workflow":
      return "agent";
    case "agent":
    case "plan":
    case "ask":
    case "debug":
      return mode;
    default: {
      const _x: never = mode;
      return _x;
    }
  }
}

/**
 * Plan mode tools — explore + land a readable plan (Notes MD), not product code.
 * notes.write/create are intentional Plan deliverables; files.write stays forbidden.
 */
const PLAN_TOOLS: readonly ToolActionId[] = [
  "tools.search",
  "tools.describe",
  "files.list",
  "files.read",
  "git.status",
  "git.diff",
  "git.github.status",
  "mcp.list_tools",
  "skills.list",
  "skills.read",
  "agents.room.list",
  "memory.search",
  "memory.get",
  "studio.config.get",
  "studio.theme.get",
  "studio.windowColors.get",
  "studio.windows.list",
  "studio.nav",
  "studio.ask_user",
  "notes.list",
  "notes.search",
  "notes.read",
  "notes.write",
  "notes.create",
  "secrets.list",
  "web.search",
];

/** Normalize unknown mode string; default agent. */
export function parseChatComposerMode(raw: unknown): ChatComposerMode {
  if (typeof raw !== "string") return "agent";
  const m = raw.trim().toLowerCase();
  if ((CHAT_COMPOSER_MODES as readonly string[]).includes(m)) {
    return m as ChatComposerMode;
  }
  return "agent";
}

/**
 * Effective mode for tool allowlists.
 * Debug / Multitask / Workflow keep full Agent tools; prompt contract differs via `systemHintForChatMode`.
 * (Workflow composer Send usually bypasses the live turn — DurableRuntime — but peers may still see the hint.)
 */
export function effectiveChatMode(mode: ChatComposerMode): "agent" | "plan" | "ask" {
  switch (mode) {
    case "ask":
      return "ask";
    case "plan":
      return "plan";
    case "agent":
    case "debug":
    case "multitask":
    case "workflow":
      return "agent";
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

/** Tool allowlist for harness; null = all catalog tools; empty = no tools. */
export function allowToolsForChatMode(
  mode: ChatComposerMode,
): readonly string[] | null {
  const eff = effectiveChatMode(mode);
  switch (eff) {
    case "ask":
      return [];
    case "plan":
      return PLAN_TOOLS;
    case "agent":
      return null;
    default: {
      const _exhaustive: never = eff;
      return _exhaustive;
    }
  }
}

export function useToolsForChatMode(mode: ChatComposerMode): boolean {
  const allow = allowToolsForChatMode(mode);
  return allow === null || allow.length > 0;
}

/** Extra system lines appended for the mode (beyond project hint). */
export function systemHintForChatMode(mode: ChatComposerMode): string {
  const eff = effectiveChatMode(mode);
  switch (eff) {
    case "ask":
      return "Mode: Ask — answer questions about the project. Do not call tools or propose file writes.";
    case "plan":
      return [
        "Mode: Plan — design a plan the user can read and approve; do not implement product code.",
        "Explore with files.list/read, git.status/diff, skills.*, memory.*, web.search, notes.read/list/search.",
        "Clarifying questions (Cursor-style): call studio.ask_user with question + options (1–8). The UI paints choice chips and parks the turn until the operator picks (or skips). Prefer studio.ask_user over a long prose questionnaire. Look up codebase facts yourself; never ask what you can files.read. Only fall back to one prose question if the tool is unavailable.",
        "Deliverable (required): end with a structured markdown plan in the chat message (Goal, Decisions, Steps, Risks/Open questions, Out of scope). The user must be able to scroll the plan in Chat without hunting tool traces.",
        "Persist (required when the plan has legs): write the same plan to Notes via notes.create or notes.write under Plans/<short-slug>.md (project scope when in a workspace; studio scope from Global), then studio.nav kind=notes so they can open it. Update the note if the plan revises.",
        "Forbidden: files.write, proposals, git.commit/push, shell that mutates, roadmap/code edits, or claiming the plan is done without chat markdown.",
      ].join(" ");
    case "agent":
      break;
    default: {
      const _exhaustive: never = eff;
      return _exhaustive;
    }
  }
  switch (mode) {
    case "debug":
      return [
        "Mode: Debug — runtime evidence first.",
        "Reproduce or gather failing signals (logs, tests, stack, painted DOM) before proposing a fix.",
        "Form a short hypothesis; change the smallest verifiable slice; re-check the signal.",
        "Do not broad-refactor while diagnosing.",
      ].join(" ");
    case "multitask":
      return "Mode: Multitask — Agent room (spawn / send / observe). Coordinate parallel agents via Studio agents.spawn / room tools; do not pretend a single-agent loop.";
    case "workflow":
      return "Mode: Workflow — help deploy a durable workflow agent in n8n that can run whenever the user wants. Prefer DurableRuntime / workflow templates over a one-shot live chat turn.";
    case "ask":
    case "plan":
    case "agent":
      break;
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
  return [
    "Mode: Agent — complete the user's request with tools before finishing.",
    "Call tools; do not narrate a long plan of searches without invoking them.",
    "Paths are project-relative (e.g. src/index.ts), never prefix the project id.",
    "Discover actions with tools.search, load schemas with tools.describe, then tools.call (action + input).",
    "Prefer files.read/list then files.write for edits (disk updates immediately; user can Undo).",
    "For large files, write the full updated file contents in one files.write — never omit content.",
    "Do not stop after exploring — apply the change.",
    "Studio windows (Roadmap, Chat, Settings, …): tools.call action=studio.nav with kinds — do not hunt the repo for a \"roadmap view\" file first.",
    "Studio chrome (theme / brand / pet / window colors): skills.read id=\"chrome\" for when/never — do not assume a color word means theme.set; refuse layout moves with no tool.",
    "API keys and tokens: secrets.set (Infisical SoT) — never write secrets only to .env.local; secrets.list to discover names.",
    "Never invent tool success — confirm from the tool result.",
    "Use git.* via tools.call for repo status/commit/push; git.github.status / git.github.connect to sign GitHub in on this Studio computer (phone link + code); studio.workspace.cloneFromGit to clone a GitHub repo into a workspace (not shell.run git clone); shell.run for host CLIs; mcp.list_tools / mcp.call for remote MCP; skills.list / skills.read before inventing process; open_in_editor to jump to a file.",
    "Parallel work: Studio Multitask mode or agents.spawn — do not invent a private subagent runtime.",
  ].join(" ");
}

/**
 * Merge composer mode hint into peer/API context string.
 * Idempotent when `base` already starts with the same mode line.
 */
export function appendChatModeContext(
  base: string | undefined,
  mode: ChatComposerMode | string | null | undefined,
): string | undefined {
  const parsed = parseChatComposerMode(mode);
  const hint = systemHintForChatMode(parsed).trim();
  const prior = base?.trim() ?? "";
  if (!hint) return prior || undefined;
  if (prior.startsWith(hint) || prior.includes(`\n${hint}`)) {
    return prior || undefined;
  }
  // Avoid double Mode: lines when Anthropic path already composed the hint.
  if (/^Mode:\s/m.test(prior) && prior.includes(`Mode: ${CHAT_MODE_LABELS[parsed]}`)) {
    return prior || undefined;
  }
  const joined = [hint, prior].filter(Boolean).join("\n\n");
  return joined || undefined;
}

/** All tool ids (for tests). */
export function allCatalogToolIds(): readonly ToolActionId[] {
  return STUDIO_TOOL_CATALOG.map((t) => t.id);
}
