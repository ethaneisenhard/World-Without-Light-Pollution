import type { AccessMode } from "./access-mode-pure.js";
import {
  DEFAULT_GLOBAL_FILE_ACCESS,
  globalFileAccessEnablesDiskTools,
  type GlobalFileAccessConfig,
} from "./global-file-access-pure.js";

export type SseChatEvent = {
  event: string;
  data: Record<string, unknown>;
  /** Registry event seq when present (`id:` SSE field). */
  seq?: number;
};

export const CHAT_IMAGE_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export type ChatImageMediaType = (typeof CHAT_IMAGE_MEDIA_TYPES)[number];

export type ChatImageAttachment = {
  mediaType: ChatImageMediaType;
  /** Raw base64 (no data: prefix). Empty while `status === "preparing"`. */
  data: string;
  name?: string;
  /**
   * Client-only blob URL for optimistic thumbs before base64 is ready.
   * Never send to the API — strip via `stripChatImagesForSend`.
   */
  previewUrl?: string;
  /** Client-only encode lifecycle. Omit / `"ready"` = sendable. */
  status?: "preparing" | "ready" | "error";
  /** Client-only stable id while encoding / replacing in place. */
  localId?: string;
};

export type ChatTurnMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  /** User vision attachments (Anthropic image blocks). */
  images?: ChatImageAttachment[];
};

export type AnthropicImageContent = {
  type: "image";
  source: {
    type: "base64";
    media_type: ChatImageMediaType;
    data: string;
  };
};

export type AnthropicTextContent = { type: "text"; text: string };

export type AnthropicMessageContent =
  | string
  | Array<AnthropicImageContent | AnthropicTextContent>;

export type AnthropicMessagesRequest = {
  model: string;
  max_tokens: number;
  stream: true;
  messages: Array<{
    role: "user" | "assistant";
    content: AnthropicMessageContent;
  }>;
  system?: string;
};

export const CHAT_IMAGE_MAX_COUNT = 5;
/** Soft client/server cap per image (~4 MiB decoded). */
export const CHAT_IMAGE_MAX_BYTES = 4 * 1024 * 1024;

/** Default Anthropic model for harness:anthropic when none requested. */
export const DEFAULT_CHAT_MODEL = "claude-haiku-4-5";
/**
 * Agent file writes need headroom: a ~7KB `files.write` body alone is >2k tokens
 * with JSON + prose. 2048 truncates tool_use mid-object → path-only writes fail.
 */
export const DEFAULT_MAX_TOKENS = 8192;

export function isChatImageMediaType(value: string): value is ChatImageMediaType {
  return (CHAT_IMAGE_MEDIA_TYPES as readonly string[]).includes(value);
}

/**
 * Intersect request/mode allowlist with Global root-safe tools.
 * When `globalFileAccess` enables any disk root (default), include files.* / git.*
 * even in guarded mode. accessMode still owns approvals + non-file catalog breadth.
 */
export function intersectStudioRootAllowTools(
  allow: readonly string[] | null,
  accessMode: AccessMode = "guarded",
  globalFileAccess: GlobalFileAccessConfig = DEFAULT_GLOBAL_FILE_ACCESS,
): string[] {
  const diskOn = globalFileAccessEnablesDiskTools(globalFileAccess);
  const root =
    diskOn || accessMode === "all"
      ? (STUDIO_ROOT_CHAT_TOOLS_ALL as readonly string[])
      : (STUDIO_ROOT_CHAT_TOOLS as readonly string[]);
  if (allow === null) return [...root];
  return allow.filter((id) => root.includes(id));
}

/**
 * Coerce a data URL to an allowlisted media type when FileReader used empty /
 * octet-stream MIME (empty-type Finder drops).
 */
export function coerceChatImageDataUrl(
  dataUrl: string,
  mediaType: ChatImageMediaType,
): string {
  const m = /^data:([^;]*);base64,(.+)$/s.exec(dataUrl.trim());
  if (!m) return dataUrl;
  const declared = (m[1] ?? "").trim().toLowerCase();
  if (isChatImageMediaType(declared)) return dataUrl;
  return `data:${mediaType};base64,${m[2]!}`;
}

/** Approximate decoded byte length from base64. */
export function estimateBase64Bytes(data: string): number {
  const padded = data.length;
  const padding = data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((padded * 3) / 4) - padding);
}

export function parseChatImageDataUrl(
  dataUrl: string,
):
  | { ok: true; image: ChatImageAttachment }
  | { ok: false; error: string } {
  const m = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl.trim());
  if (!m) return { ok: false, error: "invalid data URL" };
  const mediaType = m[1]!.toLowerCase();
  const data = m[2]!;
  if (!isChatImageMediaType(mediaType)) {
    return { ok: false, error: "unsupported image type" };
  }
  if (!data) return { ok: false, error: "empty image data" };
  if (estimateBase64Bytes(data) > CHAT_IMAGE_MAX_BYTES) {
    return { ok: false, error: "image too large" };
  }
  return { ok: true, image: { mediaType, data } };
}

/** True when the attachment has base64 ready to send (omit / `"ready"`). */
export function chatImageIsReady(img: ChatImageAttachment): boolean {
  const status = img.status ?? "ready";
  return status === "ready" && Boolean(img.data);
}

/** True while any client-side encode is still in flight. */
export function chatImagesArePreparing(
  images?: readonly ChatImageAttachment[],
): boolean {
  return (images ?? []).some((img) => img.status === "preparing");
}

/**
 * Strip client-only fields and drop non-ready rows before API / SSE send.
 */
export function stripChatImagesForSend(
  images?: readonly ChatImageAttachment[],
): ChatImageAttachment[] {
  const out: ChatImageAttachment[] = [];
  for (const img of images ?? []) {
    if (!chatImageIsReady(img)) continue;
    out.push({
      mediaType: img.mediaType,
      data: img.data,
      ...(img.name ? { name: img.name } : {}),
    });
  }
  return out;
}

/** Replace or remove one optimistic row by `localId` (immutable). */
export function replaceChatImageByLocalId(
  images: readonly ChatImageAttachment[],
  localId: string,
  next: ChatImageAttachment | null,
): ChatImageAttachment[] {
  const out: ChatImageAttachment[] = [];
  for (const img of images) {
    if (img.localId !== localId) {
      out.push(img);
      continue;
    }
    if (next) out.push(next);
  }
  return out;
}

export function canSendChatTurn(
  content: string,
  images?: readonly ChatImageAttachment[],
): boolean {
  if (chatImagesArePreparing(images)) return false;
  const readyCount = (images ?? []).filter(chatImageIsReady).length;
  return Boolean(content.trim()) || readyCount > 0;
}

/**
 * Project id for `/api/projects/:id/chat`.
 * URL → bound session → sole registered project → Glass Box Studio root (`_studio`).
 * Root chat runs without a workspace (global config / theme / skills only).
 */
export const STUDIO_ROOT_CHAT_ID = "_studio";

export function isStudioRootChatId(projectId: string | null | undefined): boolean {
  return (projectId?.trim() ?? "") === STUDIO_ROOT_CHAT_ID;
}

/** Tools allowed when chatting at Glass Box Studio home (no workspace) — Guarded. */
export const STUDIO_ROOT_CHAT_TOOLS = [
  "tools.search",
  "tools.describe",
  "tools.call",
  "studio.config.get",
  "studio.config.patch",
  "secrets.list",
  "secrets.get",
  "secrets.set",
  "secrets.sync",
  "studio.theme.get",
  "studio.theme.set",
  "studio.windowColors.get",
  "studio.windowColors.set",
  "studio.windows.list",
  "studio.experience.get",
  "studio.experience.set",
  "studio.experience.patch",
  "studio.nav",
  "studio.workspace.create",
  "studio.workspace.switch",
  "studio.workspace.list",
  "studio.workspace.get",
  "studio.workspace.link",
  "studio.workspace.cloneFromGit",
  "studio.workspace.patch",
  "studio.workspace.unlink",
  "studio.workspace.delete",
  "skills.list",
  "skills.read",
  "agents.room.list",
  "agents.room.claim",
  "agents.spawn",
  "agents.profile.list",
  "agents.profile.create",
  "agents.profile.configure",
  "memory.search",
  "memory.propose",
  "memory.get",
  "skills.forge",
  "mcp.list_tools",
  "mcp.call",
] as const;

/**
 * Global + disk roots (default globalFileAccess): chrome tools plus files/git/shell.
 * Paths resolve against Studio repo root (projectRoot = repoRoot).
 */
export const STUDIO_ROOT_CHAT_TOOLS_ALL = [
  ...STUDIO_ROOT_CHAT_TOOLS,
  "files.list",
  "files.read",
  "files.write",
  "files.apply_proposal",
  "files.discard_proposal",
  "git.status",
  "git.diff",
  "git.commit",
  "git.push",
  "git.github.status",
  "git.github.connect",
  "shell.run",
] as const;

export function resolveChatSendProjectId(input: {
  urlProjectId?: string | null;
  boundProjectId?: string | null;
  projectIds?: readonly string[];
}): string {
  const bound = input.boundProjectId?.trim() ?? "";
  // Chat scope picker (bound) wins over shell URL — workspaces keep their own
  // ledgers; Nav may still show another `?project=`.
  if (isStudioRootChatId(bound)) {
    return STUDIO_ROOT_CHAT_ID;
  }
  if (bound) return bound;
  const url = input.urlProjectId?.trim() ?? "";
  if (url) return url;
  const ids = input.projectIds ?? [];
  if (ids.length === 1) {
    const only = ids[0]?.trim() ?? "";
    if (only) return only;
  }
  return STUDIO_ROOT_CHAT_ID;
}

/** Why Send should stay blocked (empty → ok to send). */
export function chatSendBlockedReason(input: {
  content: string;
  images?: readonly ChatImageAttachment[];
  projectId: string;
  streaming?: boolean;
}): string {
  if (input.streaming) return "";
  if (chatImagesArePreparing(input.images)) {
    return "Images still loading…";
  }
  if (!canSendChatTurn(input.content, input.images)) {
    return "Type a message to send";
  }
  // Empty projectId is legacy; resolveChatSendProjectId always yields a target.
  if (!input.projectId.trim()) {
    return "Select a project before sending";
  }
  return "";
}

export function toAnthropicMessageContent(
  content: string,
  images?: readonly ChatImageAttachment[],
): AnthropicMessageContent {
  const ready = stripChatImagesForSend(images);
  if (!ready.length) return content;
  const blocks: Array<AnthropicImageContent | AnthropicTextContent> = ready.map(
    (img) => ({
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: img.mediaType,
        data: img.data,
      },
    }),
  );
  const text = content.trim();
  blocks.push({
    type: "text",
    text: text || "Describe the attached image(s).",
  });
  return blocks;
}

/** Pure parse of Kody-style SSE body */
export function parseSseBlocks(text: string): SseChatEvent[] {
  const events: SseChatEvent[] = [];
  for (const block of text.split("\n\n")) {
    const lines = block.split("\n");
    const event = lines.find((l) => l.startsWith("event: "))?.slice(7);
    const dataLine = lines.find((l) => l.startsWith("data: "));
    const idLine = lines.find((l) => l.startsWith("id: "));
    if (!event || !dataLine) continue;
    try {
      const seqRaw = idLine?.slice(4).trim();
      const seq =
        seqRaw && /^\d+$/.test(seqRaw) ? Number(seqRaw) : undefined;
      events.push({
        event,
        data: JSON.parse(dataLine.slice(6)) as Record<string, unknown>,
        ...(seq !== undefined ? { seq } : {}),
      });
    } catch {
      // skip malformed block
    }
  }
  return events;
}

export function sseEventsToAssistantText(events: SseChatEvent[]): string {
  let assistant = "";
  for (const { event, data } of events) {
    if (event === "delta" && typeof data.text === "string") assistant += data.text;
    if (event === "message" && typeof data.content === "string") assistant = data.content;
  }
  return assistant.trim();
}

/** Split system vs user/assistant for Anthropic Messages API. */
export function splitChatMessagesForAnthropic(messages: ChatTurnMessage[]): {
  system?: string;
  messages: Array<{ role: "user" | "assistant"; content: AnthropicMessageContent }>;
} {
  const systemParts: string[] = [];
  const turns: Array<{
    role: "user" | "assistant";
    content: AnthropicMessageContent;
  }> = [];
  for (const m of messages) {
    if (m.role === "system") {
      const content = m.content.trim();
      if (content) systemParts.push(content);
      continue;
    }
    const hasImages = (m.images?.length ?? 0) > 0;
    const text = m.content.trim();
    if (!text && !hasImages) continue;
    turns.push({
      role: m.role,
      content: toAnthropicMessageContent(m.content, m.images),
    });
  }
  return {
    ...(systemParts.length ? { system: systemParts.join("\n\n") } : {}),
    messages: turns,
  };
}

export function buildAnthropicMessagesRequest(input: {
  messages: ChatTurnMessage[];
  model?: string;
  maxTokens?: number;
  projectId?: string;
  /** Extra system lines (e.g. chat mode hints). */
  systemExtra?: string;
}): AnthropicMessagesRequest {
  const split = splitChatMessagesForAnthropic(input.messages);
  const projectHint = input.projectId
    ? `You are Claude in Glass Box Studio (harness: anthropic) — planning and orchestration for project "${input.projectId}" (life, work, or software). Answer first; be concise and practical. Studio is the shell; use Studio tools when needed.`
    : "You are Claude in Glass Box Studio (harness: anthropic) — planning and orchestration for anything (life, work, creative, software). Answer first; be concise and practical. Studio is the shell; use Studio tools when needed.";
  const system = [projectHint, input.systemExtra, split.system]
    .filter(Boolean)
    .join("\n\n");
  return {
    model: input.model?.trim() || DEFAULT_CHAT_MODEL,
    max_tokens: input.maxTokens ?? DEFAULT_MAX_TOKENS,
    stream: true,
    messages:
      split.messages.length > 0
        ? split.messages
        : [{ role: "user", content: "Hello" }],
    system,
  };
}

/**
 * Extract assistant text delta from one Anthropic Messages SSE JSON payload.
 * Returns null when the event carries no text.
 */
export function anthropicSseDataToTextDelta(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "[DONE]") return null;
  try {
    const parsed = JSON.parse(trimmed) as {
      type?: string;
      delta?: { type?: string; text?: string };
      error?: { message?: string };
    };
    if (parsed.type === "error") {
      throw new Error(parsed.error?.message ?? "Anthropic stream error");
    }
    if (
      parsed.type === "content_block_delta" &&
      parsed.delta?.type === "text_delta" &&
      typeof parsed.delta.text === "string"
    ) {
      return parsed.delta.text;
    }
    return null;
  } catch (e) {
    if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
      if (e.message.startsWith("Anthropic") || e.message.includes("stream")) throw e;
    }
    return null;
  }
}

/** Build stub reply text when no API key (demo / offline). */
export function buildStudioStubReply(projectId: string, lastUser: string): string {
  return `[studio stub · ${projectId}] You said: ${lastUser.slice(0, 200)}`;
}

/** Normalize unknown JSON images from the chat API body. */
export function normalizeChatImages(
  raw: unknown,
): ChatImageAttachment[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatImageAttachment[] = [];
  for (const item of raw) {
    if (out.length >= CHAT_IMAGE_MAX_COUNT) break;
    if (!item || typeof item !== "object") continue;
    const mediaType = (item as { mediaType?: unknown }).mediaType;
    const data = (item as { data?: unknown }).data;
    const name = (item as { name?: unknown }).name;
    if (typeof mediaType !== "string" || typeof data !== "string") continue;
    if (!isChatImageMediaType(mediaType)) continue;
    if (!data || estimateBase64Bytes(data) > CHAT_IMAGE_MAX_BYTES) continue;
    out.push({
      mediaType,
      data,
      ...(typeof name === "string" && name ? { name } : {}),
    });
  }
  return out;
}
