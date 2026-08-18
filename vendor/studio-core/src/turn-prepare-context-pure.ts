/**
 * Turn prepare (pre-loop) — split stable system vs dynamic last-user inject.
 *
 * Stable bytes → ContextBundle.system (prompt-cache prefix).
 * Dynamic (viewport, notes, clocks) → last user message so the system
 * prefix stays byte-identical across turns (Cache Wars property iii).
 */

import type { ChatTurnMessage } from "./chat-pure.js";
import type { HarnessContextTier } from "./harness-context-tier-pure.js";

export type TurnPrepareContextInput = {
  tier: HarnessContextTier;
  viewportContext?: string | null;
  notesSlice?: string | null;
  rootHint?: string | null;
  rulesPreamble?: string | null;
  skillsPreamble?: string | null;
  memorySlice?: string | null;
  /**
   * Agent room siblings / overlaps — always dynamic
   * (changes per turn; must not enter frozen stable prefix).
   */
  presenceSlice?: string | null;
  /** Peer-minimal MCP one-liner — stable. */
  mcpFact?: string | null;
  /**
   * Opt-in: inject Memory slice for peer-minimal tiers
   * (`ai.peerMemoryInject`). Default off — peers use MCP `memory.*`.
   */
  peerMemoryInject?: boolean;
};

export type TurnPrepareContextSplit = {
  /** Parts for ContextBundle.system / bundle.system */
  stableParts: string[];
  /** Parts appended to last user message */
  dynamicParts: string[];
};

function trimPart(p: string | null | undefined): string {
  return typeof p === "string" ? p.trim() : "";
}

/**
 * Classify turn-prepare parts into stable (system) vs dynamic (last user).
 *
 * studio-full: rules/skills/memory/rootHint stable; viewport + notes dynamic.
 * peer-minimal: mcpFact stable; viewport (+ presence) dynamic.
 * peer-minimal + peerMemoryInject: memory also dynamic (peers skip our cache).
 */
export function splitTurnPrepareContext(
  input: TurnPrepareContextInput,
): TurnPrepareContextSplit {
  const viewport = trimPart(input.viewportContext);
  const notes = trimPart(input.notesSlice);
  const rootHint = trimPart(input.rootHint);
  const rules = trimPart(input.rulesPreamble);
  const skills = trimPart(input.skillsPreamble);
  const memory = trimPart(input.memorySlice);
  const presence = trimPart(input.presenceSlice);
  const mcp = trimPart(input.mcpFact);

  if (input.tier === "peer-minimal") {
    const stableParts = [mcp].filter(Boolean);
    const dynamicParts = [
      viewport,
      presence,
      input.peerMemoryInject ? memory : "",
    ].filter(Boolean);
    return { stableParts, dynamicParts };
  }

  const stableParts = [rootHint, rules, skills, memory].filter(Boolean);
  const dynamicParts = [viewport, notes, presence].filter(Boolean);
  return { stableParts, dynamicParts };
}

/** Join dynamic parts for a single footer block. */
export function joinDynamicContextParts(
  parts: readonly string[],
): string {
  return parts.map((p) => p.trim()).filter(Boolean).join("\n\n");
}

/**
 * Append dynamic context to the last user message (clone; no mutate).
 * If no user message exists, returns messages unchanged.
 */
export function appendDynamicContextToLastUserMessage(
  messages: readonly ChatTurnMessage[],
  dynamicText: string,
): ChatTurnMessage[] {
  const dyn = dynamicText.trim();
  if (!dyn) return messages.map((m) => ({ ...m }));

  const out = messages.map((m) => ({
    ...m,
    ...(m.images?.length ? { images: [...m.images] } : {}),
  }));
  for (let i = out.length - 1; i >= 0; i--) {
    if (out[i]!.role === "user") {
      const prev = out[i]!.content?.trim() ?? "";
      out[i] = {
        ...out[i]!,
        content: prev
          ? `${prev}\n\n<context-dynamic>\n${dyn}\n</context-dynamic>`
          : `<context-dynamic>\n${dyn}\n</context-dynamic>`,
      };
      return out;
    }
  }
  return out;
}

/**
 * Full turn-prepare: split + optional append. Pure — no I/O.
 */
export function applyTurnPrepareToMessages(input: {
  messages: readonly ChatTurnMessage[];
  split: TurnPrepareContextSplit;
}): {
  stableSystemParts: string[];
  messages: ChatTurnMessage[];
  dynamicText: string;
} {
  const dynamicText = joinDynamicContextParts(input.split.dynamicParts);
  return {
    stableSystemParts: [...input.split.stableParts],
    messages: appendDynamicContextToLastUserMessage(
      input.messages,
      dynamicText,
    ),
    dynamicText,
  };
}
