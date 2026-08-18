/**
 * LLM (or injected) summarize strategy — registry row.
 * Orchestrator supplies summaryText via deps; pure applies marker + retain tail.
 */

import type {
  CompactMessage,
  CompactStrategy,
  CompactStrategyInput,
  CompactStrategyResult,
} from "./chat-compact-types-pure.js";
import { assignMessageIds, messageIdAt } from "./chat-compact-types-pure.js";
import { formatContextCompressSummary } from "./context-compress-pure.js";

export const LLM_SUMMARIZE_DEFAULT_RETAIN = 6;
export const LLM_SUMMARIZE_MAX_INPUT_CHARS = 120_000;

export function formatLlmSummarizeSystemPrompt(): string {
  return [
    "You compact conversation history for Glass Box Studio's chat shell.",
    "Preserve durable facts, user goals, decisions, constraints, tool findings, IDs, names, and unresolved work.",
    "Include the current state of the task and the next concrete step if work was in progress.",
    "Keep important entity IDs, paths, tool results, errors, and user preferences exact.",
    "Omit chatter, repeated progress narration, and obsolete failed attempts unless they affect future behavior.",
    "Write a concise but complete summary that another model can use as context for continuing the task.",
    "Return plain text summary only — no JSON wrapper.",
  ].join("\n");
}

export function formatLlmSummarizeUserPrompt(transcript: string): string {
  return [
    "Compact this earlier conversation history for future turns.",
    "Structure the summary around:",
    "- user intent and requested outcome",
    "- durable facts, IDs, names, and constraints",
    "- tool findings and decisions",
    "- unresolved work, current state, and next step",
    "",
    "<conversation>",
    transcript,
    "</conversation>",
  ].join("\n");
}

export function transcriptForSummarize(
  messages: readonly CompactMessage[],
  maxChars = LLM_SUMMARIZE_MAX_INPUT_CHARS,
): string {
  const body = messages
    .map((m) => `(${m.role}) ${m.content ?? ""}`)
    .join("\n\n");
  return body.length > maxChars ? body.slice(-maxChars) : body;
}

export function applyLlmSummarizeCompact(
  input: CompactStrategyInput,
): CompactStrategyResult {
  const retain = input.retainRecentMessages ?? LLM_SUMMARIZE_DEFAULT_RETAIN;
  const numbered = assignMessageIds(input.messages);
  if (numbered.length <= retain) {
    return {
      messages: numbered,
      applied: false,
      strategyId: "llm_summarize",
      coveredMessageIds: [],
      summary: null,
      droppedCount: 0,
    };
  }
  const older = numbered.slice(0, -retain);
  const recent = numbered.slice(-retain);
  const coveredMessageIds = older.map((m, i) => messageIdAt(m, i));
  const summary =
    (typeof input.summaryText === "string" && input.summaryText.trim()
      ? input.summaryText.trim()
      : null) ??
    formatContextCompressSummary({
      olderMessages: older,
      projectId: input.projectId,
    });
  const wrapped = [
    "This conversation is being continued from earlier context.",
    "Use this summary as prior context, and do not acknowledge the summary to the user.",
    "",
    "<summary>",
    summary,
    "</summary>",
  ].join("\n");
  const marker: CompactMessage = {
    id: `compact_llm_${Date.now().toString(36)}`,
    role: "user",
    content: wrapped,
    compaction: {
      coveredMessageIds,
      reason: "llm_summarize",
      strategyId: "llm_summarize",
    },
  };
  return {
    messages: [marker, ...recent],
    applied: true,
    strategyId: "llm_summarize",
    coveredMessageIds,
    summary: wrapped,
    droppedCount: older.length,
  };
}

export const llmSummarizeCompactStrategy: CompactStrategy = {
  id: "llm_summarize",
  apply: applyLlmSummarizeCompact,
};
