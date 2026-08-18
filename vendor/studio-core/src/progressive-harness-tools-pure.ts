/**
 * Progressive Studio MCP tool surface for API harnesses (Anthropic + Chat Completions).
 * One selector — Agent = meta trio; Plan = concrete read tools.
 */

import { effectiveChatMode, type ChatComposerMode } from "./chat-mode-pure.js";
import {
  anthropicHarnessToolDefinitions,
  anthropicToolDefinitions,
} from "./tool-catalog-pure.js";

export type ProgressiveHarnessToolDef = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
};

/** Tool schemas for the Host-owned API tool loop (transport converts as needed). */
export function progressiveHarnessToolDefinitions(
  mode: ChatComposerMode,
  allowTools?: readonly string[],
): ProgressiveHarnessToolDef[] {
  return effectiveChatMode(mode) === "agent"
    ? anthropicHarnessToolDefinitions(allowTools)
    : anthropicToolDefinitions(allowTools);
}
