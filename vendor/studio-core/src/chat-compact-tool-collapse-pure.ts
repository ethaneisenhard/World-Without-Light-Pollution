/**
 * Collapse bulky tool-result / code fences in older turns (cheap first strategy).
 */

import type {
  CompactStrategy,
  CompactStrategyInput,
  CompactStrategyResult,
} from "./chat-compact-types-pure.js";
import { assignMessageIds } from "./chat-compact-types-pure.js";

const TOOL_BLOB_RE =
  /(?:Tool result|tool_result|<tool_result>)[\s\S]{400,}?(?=\n\n|\n(?:User|Assistant|Human):|$)/gi;
const FENCE_RE = /```[\s\S]{800,}?```/g;

export const TOOL_COLLAPSE_DEFAULT_RETAIN = 6;
export const TOOL_COLLAPSE_MAX_ASSISTANT_CHARS = 2_400;

function collapseContent(content: string): { text: string; changed: boolean } {
  let text = content;
  let changed = false;
  const nextFence = text.replace(FENCE_RE, (block) => {
    changed = true;
    return "```\n…[collapsed code/tool output]…\n```";
  });
  text = nextFence;
  const nextTool = text.replace(TOOL_BLOB_RE, () => {
    changed = true;
    return "[collapsed tool result]";
  });
  text = nextTool;
  if (text.length > TOOL_COLLAPSE_MAX_ASSISTANT_CHARS) {
    text = `${text.slice(0, TOOL_COLLAPSE_MAX_ASSISTANT_CHARS)}\n…[truncated]`;
    changed = true;
  }
  return { text, changed };
}

export function applyToolResultCollapse(
  input: CompactStrategyInput,
): CompactStrategyResult {
  const retain = input.retainRecentMessages ?? TOOL_COLLAPSE_DEFAULT_RETAIN;
  const numbered = assignMessageIds(input.messages);
  if (numbered.length <= retain) {
    return {
      messages: numbered,
      applied: false,
      strategyId: "tool_result_collapse",
      coveredMessageIds: [],
      summary: null,
      droppedCount: 0,
    };
  }
  const cutoff = numbered.length - retain;
  let changedAny = false;
  const coveredMessageIds: string[] = [];
  const messages = numbered.map((m, i) => {
    if (i >= cutoff || m.role !== "assistant") return m;
    const { text, changed } = collapseContent(m.content ?? "");
    if (!changed) return m;
    changedAny = true;
    if (m.id) coveredMessageIds.push(m.id);
    return { ...m, content: text };
  });
  return {
    messages,
    applied: changedAny,
    strategyId: "tool_result_collapse",
    coveredMessageIds,
    summary: null,
    droppedCount: 0,
  };
}

export const toolResultCollapseStrategy: CompactStrategy = {
  id: "tool_result_collapse",
  apply: applyToolResultCollapse,
};
