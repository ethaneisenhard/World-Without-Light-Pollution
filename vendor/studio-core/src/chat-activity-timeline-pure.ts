/**
 * Process modal face — coalesced reasoning + tool timeline (no duplicate notes).
 */

import { coalesceThinkingNotes } from "./coalesce-chat-thinking-pure.js";

export type TimelineThinkingStep = {
  kind: "thinking";
  id: string;
  text: string;
};

export type TimelineToolStep = {
  kind: "tool";
  id: string;
  name: string;
  title: string;
  subtitle?: string;
  body?: string;
  state: "running" | "done";
};

export type TimelinePhaseStep = {
  kind: "phase";
  id: string;
  text: string;
};

export type ChatActivityTimelineStep =
  | TimelineThinkingStep
  | TimelineToolStep
  | TimelinePhaseStep;

export type ChatProcessFace = {
  nowLine: string | null;
  reasoning: string | null;
  tools: TimelineToolStep[];
  hasReasoning: boolean;
  toolCount: number;
  /** Reasoning counts as 1 + tools (not raw note fragment count). */
  stepCount: number;
  summaryLabel: string;
};

function titleCaseTool(name: string): string {
  const raw = (name || "tool").trim();
  if (!raw) return "Tool";
  const parts = raw.split(/[./]/).filter(Boolean);
  const last = parts[parts.length - 1] ?? raw;
  return last
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function mapToolStep(
  t: {
    id: string;
    name: string;
    state: "running" | "done";
    detail?: string;
    title?: string;
    subtitle?: string;
    body?: string;
  },
  index: number,
): TimelineToolStep {
  return {
    kind: "tool",
    id: t.id || `tool_${index}`,
    name: t.name,
    title: t.title || titleCaseTool(t.name),
    subtitle: t.subtitle ?? t.detail,
    body: t.body ?? t.detail,
    state: t.state,
  };
}

/**
 * Industry-style process face: one reasoning block + tool rows + live Now line.
 */
export function projectChatProcessFace(input: {
  thinking?: readonly string[] | null;
  tools?: readonly {
    id: string;
    name: string;
    state: "running" | "done";
    detail?: string;
    title?: string;
    subtitle?: string;
    body?: string;
  }[] | null;
  /** Short harness phase only — never pet/whimsy lines. */
  phaseDetail?: string | null;
  streaming?: boolean;
}): ChatProcessFace {
  const reasoning = coalesceThinkingNotes(input.thinking);
  const toolsRaw = Array.isArray(input.tools) ? input.tools : [];
  const tools = toolsRaw.map((t, i) => mapToolStep(t, i));
  const toolCount = tools.length;
  const hasReasoning = Boolean(reasoning);
  const stepCount = (hasReasoning ? 1 : 0) + toolCount;

  const running = [...tools].reverse().find((t) => t.state === "running");
  const phase = shortProcessPhase(input.phaseDetail);

  let nowLine: string | null = null;
  if (running) {
    const label = running.title || running.name;
    const sub = running.subtitle;
    nowLine = sub ? `${label} · ${sub}` : `Running ${label}`;
  } else if (input.streaming && hasReasoning) {
    nowLine = "Reasoning…";
  } else if (input.streaming && phase) {
    nowLine = phase;
  } else if (input.streaming) {
    nowLine = "Working…";
  }

  const summaryLabel = buildProcessSummaryLabel({
    hasReasoning,
    toolCount,
    streaming: Boolean(input.streaming),
  });

  return {
    nowLine,
    reasoning,
    tools,
    hasReasoning,
    toolCount,
    stepCount,
    summaryLabel,
  };
}

/** Allow short harness phases; drop whimsy / thinking-prose blobs. */
export function shortProcessPhase(
  phaseDetail: string | null | undefined,
): string | null {
  if (typeof phaseDetail !== "string") return null;
  const s = phaseDetail.trim();
  if (!s) return null;
  // Thinking dumps / long status never belong on the process Now line.
  if (s.length > 72 || s.includes("\n")) return null;
  return s;
}

export function buildProcessSummaryLabel(input: {
  hasReasoning: boolean;
  toolCount: number;
  streaming?: boolean;
}): string {
  const parts: string[] = [];
  if (input.streaming) parts.push("Live");
  if (input.hasReasoning) parts.push("Reasoning");
  if (input.toolCount === 1) parts.push("1 tool");
  else if (input.toolCount > 1) parts.push(`${input.toolCount} tools`);
  if (parts.length === 0) return "Process";
  return parts.join(" · ");
}

/**
 * @deprecated Prefer `projectChatProcessFace` — kept for callers that still
 * want a flat step list. Thinking is omitted from `steps` (use `reasoning`).
 */
export function buildChatActivityTimeline(input: {
  thinking?: readonly string[] | null;
  tools?: readonly {
    id: string;
    name: string;
    state: "running" | "done";
    detail?: string;
    title?: string;
    subtitle?: string;
    body?: string;
  }[] | null;
  phaseDetail?: string | null;
}): {
  nowLine: string | null;
  reasoning: string | null;
  steps: ChatActivityTimelineStep[];
} {
  const face = projectChatProcessFace(input);
  return {
    nowLine: face.nowLine,
    reasoning: face.reasoning,
    steps: face.tools,
  };
}
