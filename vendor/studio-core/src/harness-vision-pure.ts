/**
 * Harness vision connectors — how chat images reach each peer.
 * Host prepare picks a connector from the registry; adapters stay transport-only.
 * Never silently redirect harness id on image turns.
 */

import type { ChatTurnMessage } from "./chat-pure.js";
import {
  findLastCliUserTurn,
  formatCliHarnessUserPrompt,
} from "./chat-cli-images-pure.js";
import { BUILTIN_HARNESS_IDS, normalizeHarnessIdAlias } from "./harness-policy-pure.js";

/**
 * Vision connector mode for a harness.
 * - native: multimodal image blocks on messages
 * - files: materialize + path facts in last user text (CLI Read)
 * - mcp-vision: same as files + peer may call studio.vision.describe
 * - unsupported: images present → fail turn (no strip-and-lie, no hijack)
 */
export type HarnessVisionMode =
  | "native"
  | "files"
  | "mcp-vision"
  | "unsupported";

/**
 * Registered harness → vision connector.
 * New harness: add one row — do not fork image logic inside the adapter.
 */
export const HARNESS_VISION_MODE: Readonly<Record<string, HarnessVisionMode>> = {
  [BUILTIN_HARNESS_IDS.studio]: "native",
  [BUILTIN_HARNESS_IDS.anthropic]: "native",
  // DeepSeek Chat Completions is text-only — Host materializes + MCP describe.
  [BUILTIN_HARNESS_IDS.deepseek]: "mcp-vision",
  [BUILTIN_HARNESS_IDS.litellm]: "mcp-vision",
  [BUILTIN_HARNESS_IDS.cursor]: "mcp-vision",
  [BUILTIN_HARNESS_IDS.hermes]: "mcp-vision",
  [BUILTIN_HARNESS_IDS.kody]: "unsupported",
  [BUILTIN_HARNESS_IDS.grok]: "mcp-vision",
};

export function visionModeForHarness(harnessId: string): HarnessVisionMode {
  const id = normalizeHarnessIdAlias(harnessId);
  return HARNESS_VISION_MODE[id] ?? "unsupported";
}

/** True when Host must materialize attachments to workspace paths. */
export function visionModeUsesWorkspaceFiles(mode: HarnessVisionMode): boolean {
  return mode === "files" || mode === "mcp-vision";
}

/** True when peer may use studio.vision.describe (MCP). */
export function visionModeOffersMcpDescribe(mode: HarnessVisionMode): boolean {
  return mode === "mcp-vision";
}

/** True when the last user turn carries ready image attachments. */
export function lastUserTurnHasImages(
  messages: readonly ChatTurnMessage[],
): boolean {
  const turn = findLastCliUserTurn(messages);
  return (turn?.images.length ?? 0) > 0;
}

/** Drop image fields; keep text. Returns how many attachments were removed. */
export function stripChatMessageImages(
  messages: readonly ChatTurnMessage[],
): { messages: ChatTurnMessage[]; strippedCount: number } {
  let strippedCount = 0;
  const next = messages.map((m) => {
    const n = m.images?.length ?? 0;
    if (!n) return { ...m };
    strippedCount += n;
    const { images: _drop, ...rest } = m;
    return { ...rest };
  });
  return { messages: next, strippedCount };
}

/** Index of last user turn that has text and/or ready images. */
export function indexOfLastCliUserTurn(
  messages: readonly ChatTurnMessage[],
): number {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (findLastCliUserTurn([messages[i]!])) return i;
  }
  return -1;
}

/**
 * After workspace materialize: fold paths into last user text, clear image fields
 * so CLI adapters stay text-only.
 */
export function foldWorkspaceAttachmentsIntoMessages(
  messages: readonly ChatTurnMessage[],
  attachmentPaths: readonly string[],
): ChatTurnMessage[] {
  const lastIdx = indexOfLastCliUserTurn(messages);
  if (lastIdx < 0) {
    return stripChatMessageImages(messages).messages;
  }
  const turn = findLastCliUserTurn(messages)!;
  const prompt = formatCliHarnessUserPrompt({
    userText: turn.content,
    attachmentPaths,
  });
  return messages.map((m, i) => {
    if (i === lastIdx) {
      return { role: "user", content: prompt };
    }
    if (m.images?.length) {
      const { images: _drop, ...rest } = m;
      return { ...rest };
    }
    return { ...m };
  });
}

/** Error copy when harness vision connector is unsupported and images are attached. */
export function unsupportedVisionError(harnessId: string): string {
  const id = harnessId.trim() || "this harness";
  return [
    `Harness "${id}" cannot accept image attachments.`,
    "Detach images, or pick a harness with vision (studio / anthropic / deepseek / cursor / hermes / grok).",
    "Text-only peers use Host materialize + studio.vision.describe via Studio MCP.",
  ].join(" ");
}
