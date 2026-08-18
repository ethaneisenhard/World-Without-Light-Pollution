/**
 * Shell intent bus — remote MCP/CLI → open Studio chrome.
 * Nav stays StudioNavCommand; chat.send drives live Chat send in the tab.
 */

import {
  parseChatComposerMode,
  type ChatComposerMode,
} from "./chat-mode-pure.js";
import {
  parseChatFocusInput,
  type ChatFocusTarget,
} from "./chat-focus-pure.js";

export type ShellIntentKind = "nav" | "chat.send" | "chat.focus";

export type ShellChatSendIntent = {
  kind: "chat.send";
  text: string;
  mode: ChatComposerMode;
  projectId: string | null;
  chatId: string | null;
  harness: string | null;
  focus: boolean;
  /** Start a new Chat session before send (Voice jobs; skip live-turn queue). */
  newChat: boolean;
};

export type ShellChatFocusIntent = {
  kind: "chat.focus";
} & ChatFocusTarget;

export type ParseShellChatSendResult =
  | { ok: true; intent: ShellChatSendIntent }
  | { ok: false; error: string };

const VOICE_WRAP_RE = /\n---\s*\nStudio Voice job\b/i;

/** Drop the Voice conductor wrap so Chat only sees the user's words. */
export function stripVoiceJobWrap(text: string): string {
  const t = text.trim();
  const cut = t.search(VOICE_WRAP_RE);
  return cut === -1 ? t : t.slice(0, cut).trim();
}

/**
 * Validate tools.call / CLI input for studio.chat.send.
 */
export function parseShellChatSendInput(
  raw: Record<string, unknown>,
): ParseShellChatSendResult {
  const rawText =
    typeof raw.text === "string"
      ? raw.text
      : typeof raw.message === "string"
        ? raw.message
        : "";
  const text = stripVoiceJobWrap(rawText);
  if (!text) {
    return { ok: false, error: "text (or message) is required" };
  }
  if (text.length > 32_000) {
    return { ok: false, error: "text too long (max 32000)" };
  }
  const mode = parseChatComposerMode(
    typeof raw.mode === "string" ? raw.mode : "agent",
  );
  const projectId =
    typeof raw.projectId === "string" && raw.projectId.trim()
      ? raw.projectId.trim()
      : null;
  const chatId =
    typeof raw.chatId === "string" && raw.chatId.trim()
      ? raw.chatId.trim()
      : null;
  const harness =
    typeof raw.harness === "string" && raw.harness.trim()
      ? raw.harness.trim()
      : null;
  const focus = raw.focus === false ? false : true;
  const newChat = !chatId;
  return {
    ok: true,
    intent: {
      kind: "chat.send",
      text,
      mode,
      projectId,
      chatId,
      harness,
      focus,
      newChat,
    },
  };
}

export type ParseShellChatFocusResult =
  | { ok: true; intent: ShellChatFocusIntent }
  | { ok: false; error: string };

/** Validate tools.call / CLI input for studio.chat.focus. */
export function parseShellChatFocusInput(
  raw: Record<string, unknown>,
): ParseShellChatFocusResult {
  const parsed = parseChatFocusInput(raw);
  if (!parsed.ok) return parsed;
  return {
    ok: true,
    intent: {
      kind: "chat.focus",
      ...parsed.target,
    },
  };
}

/** When no Studio tab is listening on the shell intent WS. */
export function shellIntentNoSubscriberHint(subscribers: number): string | null {
  if (subscribers > 0) return null;
  return "No open Studio tab is listening. Open Studio (pnpm dev → :4400) and keep a tab focused so shell-nav WS can apply this intent.";
}

export function createShellIntentId(
  prefix: "nav" | "chat" | "focus",
  now = Date.now(),
): string {
  return `${prefix}_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
