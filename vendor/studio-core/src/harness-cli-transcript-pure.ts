/**
 * CLI harness history prepare — fold Studio chat turns into last user text.
 * Adapters stay transport-only (lastUserText / one-shot prompt).
 */

import type { ChatTurnMessage } from "./chat-pure.js";
import { BUILTIN_HARNESS_IDS, normalizeHarnessIdAlias } from "./harness-policy-pure.js";

/** How a harness receives prior Studio chat turns. */
export type HarnessHistoryMode = "messages" | "prompt-transcript" | "none";

/**
 * Registered harness → history mode.
 * New harness: one row here — do not invent history forks inside adapters.
 */
export const HARNESS_HISTORY_MODE: Readonly<
  Record<string, HarnessHistoryMode>
> = {
  [BUILTIN_HARNESS_IDS.studio]: "messages",
  [BUILTIN_HARNESS_IDS.anthropic]: "messages",
  [BUILTIN_HARNESS_IDS.deepseek]: "messages",
  [BUILTIN_HARNESS_IDS.kody]: "messages",
  [BUILTIN_HARNESS_IDS.cursor]: "prompt-transcript",
  [BUILTIN_HARNESS_IDS.hermes]: "prompt-transcript",
  [BUILTIN_HARNESS_IDS.grok]: "prompt-transcript",
};

export function historyModeForHarness(harnessId: string): HarnessHistoryMode {
  const id = normalizeHarnessIdAlias(harnessId);
  return HARNESS_HISTORY_MODE[id] ?? "none";
}

export type FoldChatTranscriptOpts = {
  /** Max characters of prior turns (default 24_000). */
  maxPriorChars?: number;
  /** Max prior user+assistant turns before the current user (default 40). */
  maxPriorTurns?: number;
  /** When picker harness changed mid-thread. */
  handoff?: {
    fromHarness: string;
    toHarness: string;
    viewportContext?: string;
  };
};

const DEFAULT_MAX_PRIOR_CHARS = 24_000;
const DEFAULT_MAX_PRIOR_TURNS = 40;

/** First-class harness-switch packet for CLI prompt continuity. */
export function buildHarnessHandoffBlock(input: {
  fromHarness: string;
  toHarness: string;
  viewportContext?: string;
}): string {
  const from = input.fromHarness.trim() || "unknown";
  const to = input.toHarness.trim() || "unknown";
  if (from === to) return "";
  const lines = [
    "# Harness handoff",
    `Previous harness: ${from}`,
    `Current harness: ${to}`,
    "Continue the same task; do not re-ask for context already in this thread.",
  ];
  const viewport = input.viewportContext?.trim();
  if (viewport) {
    lines.push("", "## Viewport", viewport.slice(0, 2_000));
  }
  return lines.join("\n");
}

function truncateTail(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `…[earlier turns truncated]\n${text.slice(-(maxChars - 28))}`;
}

/**
 * Serialize prior turns (everything before the last user message) for a CLI prompt.
 * Returns empty string when there is nothing prior worth folding.
 */
export function foldChatTranscriptForCliPrompt(
  messages: readonly ChatTurnMessage[],
  opts?: FoldChatTranscriptOpts,
): string {
  const maxChars = opts?.maxPriorChars ?? DEFAULT_MAX_PRIOR_CHARS;
  const maxTurns = opts?.maxPriorTurns ?? DEFAULT_MAX_PRIOR_TURNS;

  let lastUserIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]!;
    if (m.role === "user" && m.content?.trim()) {
      lastUserIdx = i;
      break;
    }
  }
  if (lastUserIdx < 0) return "";

  const prior = messages.slice(0, lastUserIdx).filter((m) => {
    if (m.role === "system") return false;
    return Boolean(m.content?.trim());
  });
  const handoff = opts?.handoff
    ? buildHarnessHandoffBlock(opts.handoff)
    : "";
  if (!prior.length && !handoff) return "";

  const lines: string[] = [];
  if (handoff) {
    lines.push(handoff, "");
  }
  if (prior.length) {
    const windowed =
      prior.length > maxTurns ? prior.slice(prior.length - maxTurns) : prior;
    lines.push(
      "# Prior conversation (Studio chat)",
      "Continue from this thread. Do not ask for context already below.",
      "",
    );
    for (const m of windowed) {
      const label = m.role === "assistant" ? "Assistant" : "User";
      lines.push(`${label}:`, m.content.trim(), "");
    }
  }
  return truncateTail(lines.join("\n").trimEnd(), maxChars);
}

/**
 * When history mode is prompt-transcript, rewrite the last user message to
 * include prior turns + current request. Other messages unchanged.
 */
export function prepareChatMessagesForHarnessHistory(
  messages: readonly ChatTurnMessage[],
  harnessId: string,
  opts?: FoldChatTranscriptOpts,
): ChatTurnMessage[] {
  if (historyModeForHarness(harnessId) !== "prompt-transcript") {
    return messages.map((m) => ({ ...m }));
  }

  const prior = foldChatTranscriptForCliPrompt(messages, opts);
  if (!prior) return messages.map((m) => ({ ...m }));

  let lastUserIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]!.role === "user" && messages[i]!.content?.trim()) {
      lastUserIdx = i;
      break;
    }
  }
  if (lastUserIdx < 0) return messages.map((m) => ({ ...m }));

  const last = messages[lastUserIdx]!;
  const current = last.content.trim();
  const folded = [prior, "", "# Current request", current].join("\n");

  return messages.map((m, i) =>
    i === lastUserIdx ? { ...m, content: folded } : { ...m },
  );
}
