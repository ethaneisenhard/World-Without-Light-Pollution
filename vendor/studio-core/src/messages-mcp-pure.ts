/**
 * messages.* MCP — parse inputs + Chat handoff projections (no I/O).
 */

export type MessagesMcpChannel =
  | "email"
  | "slack"
  | "telegram"
  | "whatsapp"
  | "sms"
  | "webhook"
  | "other";

export type MessagesMcpStatus = "unread" | "read" | "starred" | "archived";

/** Minimal envelope shape for handoff formatting (matches StudioMessage). */
export type MessagesMcpEnvelope = {
  id: string;
  conversationId: string;
  channel: MessagesMcpChannel;
  direction: "in" | "out";
  from?: { name?: string; address?: string };
  body: { text: string; html?: string };
  status: MessagesMcpStatus;
  projectId?: string | null;
  meta?: Record<string, unknown>;
};

export type MessagesListParsed = {
  conversationId?: string;
  channel?: MessagesMcpChannel;
  status?: MessagesMcpStatus;
  limit?: number;
  projectId?: string | null;
  cursor?: string;
  folder?: "all" | "email" | "chats" | "starred" | "archived";
  q?: string;
};

export type MessagesGetParsed = { messageId: string };
export type MessagesPatchParsed = {
  messageId: string;
  status: MessagesMcpStatus;
};
export type MessagesSendParsed = {
  conversationId: string;
  channel: MessagesMcpChannel;
  bodyText: string;
  bodyHtml?: string;
  to?: { name?: string; address?: string };
  from?: { name?: string; address?: string };
  projectId?: string | null;
  meta?: Record<string, unknown>;
  confirm?: boolean;
};
export type MessagesOpenInChatParsed = { messageId: string };

export type MessageChatHandoff = {
  messageId: string;
  conversationId: string;
  channel: MessagesMcpChannel;
  preview: string;
  contextBlock: string;
  composerDraft: string;
  projectId?: string | null;
};

const CHANNELS = new Set<string>([
  "email",
  "slack",
  "telegram",
  "whatsapp",
  "sms",
  "webhook",
  "other",
]);
const STATUSES = new Set<string>(["unread", "read", "starred", "archived"]);

function asChannel(v: unknown): MessagesMcpChannel | undefined {
  return typeof v === "string" && CHANNELS.has(v)
    ? (v as MessagesMcpChannel)
    : undefined;
}

function asStatus(v: unknown): MessagesMcpStatus | undefined {
  return typeof v === "string" && STATUSES.has(v)
    ? (v as MessagesMcpStatus)
    : undefined;
}

function asParty(
  v: unknown,
): { name?: string; address?: string } | undefined {
  if (!v || typeof v !== "object" || Array.isArray(v)) return undefined;
  const o = v as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name.trim() : undefined;
  const address = typeof o.address === "string" ? o.address.trim() : undefined;
  if (!name && !address) return undefined;
  return {
    ...(name ? { name } : {}),
    ...(address ? { address } : {}),
  };
}

export function parseMessagesListInput(
  input: Record<string, unknown>,
): { ok: true; value: MessagesListParsed } | { ok: false; error: string } {
  const conversationId =
    typeof input.conversationId === "string" && input.conversationId.trim()
      ? input.conversationId.trim()
      : undefined;
  const channelRaw = input.channel;
  const channel =
    channelRaw === undefined || channelRaw === null || channelRaw === ""
      ? undefined
      : asChannel(channelRaw);
  if (
    channelRaw !== undefined &&
    channelRaw !== null &&
    String(channelRaw).trim() !== "" &&
    !channel
  ) {
    return { ok: false, error: "Invalid channel" };
  }
  const statusRaw = input.status;
  const status =
    statusRaw === undefined || statusRaw === null || statusRaw === ""
      ? undefined
      : asStatus(statusRaw);
  if (
    statusRaw !== undefined &&
    statusRaw !== null &&
    String(statusRaw).trim() !== "" &&
    !status
  ) {
    return { ok: false, error: "Invalid status (unread|read|starred|archived)" };
  }
  let limit: number | undefined;
  if (input.limit !== undefined && input.limit !== null && input.limit !== "") {
    const n = Number(input.limit);
    if (!Number.isFinite(n) || n < 1) {
      return { ok: false, error: "limit must be a positive number" };
    }
    limit = Math.min(Math.floor(n), 100);
  }
  const cursor =
    typeof input.cursor === "string" && input.cursor.trim()
      ? input.cursor.trim()
      : undefined;
  const folderRaw = input.folder;
  const folder =
    folderRaw === "all" ||
    folderRaw === "email" ||
    folderRaw === "chats" ||
    folderRaw === "starred" ||
    folderRaw === "archived"
      ? folderRaw
      : undefined;
  const q =
    typeof input.q === "string" && input.q.trim() ? input.q.trim() : undefined;
  const out: MessagesListParsed = {
    ...(conversationId ? { conversationId } : {}),
    ...(channel ? { channel } : {}),
    ...(status ? { status } : {}),
    ...(limit !== undefined ? { limit } : {}),
    ...(cursor ? { cursor } : {}),
    ...(folder ? { folder } : {}),
    ...(q ? { q } : {}),
  };
  if (
    "projectId" in input ||
    input.untagged === true ||
    input.untagged === "1"
  ) {
    if (input.untagged === true || input.untagged === "1") {
      out.projectId = null;
    } else if (input.projectId === null || input.projectId === "") {
      out.projectId = null;
    } else if (typeof input.projectId === "string" && input.projectId.trim()) {
      out.projectId = input.projectId.trim();
    }
  }
  return { ok: true, value: out };
}

export function parseMessagesGetInput(
  input: Record<string, unknown>,
): { ok: true; value: MessagesGetParsed } | { ok: false; error: string } {
  const messageId =
    typeof input.messageId === "string"
      ? input.messageId.trim()
      : typeof input.id === "string"
        ? input.id.trim()
        : "";
  if (!messageId) return { ok: false, error: "messageId required" };
  return { ok: true, value: { messageId } };
}

export function parseMessagesPatchInput(
  input: Record<string, unknown>,
): { ok: true; value: MessagesPatchParsed } | { ok: false; error: string } {
  const get = parseMessagesGetInput(input);
  if (!get.ok) return get;
  const status = asStatus(input.status);
  if (!status) {
    return { ok: false, error: "status must be unread|read|starred|archived" };
  }
  return { ok: true, value: { messageId: get.value.messageId, status } };
}

export function parseMessagesSendInput(
  input: Record<string, unknown>,
): { ok: true; value: MessagesSendParsed } | { ok: false; error: string } {
  const conversationId =
    typeof input.conversationId === "string"
      ? input.conversationId.trim()
      : "";
  if (!conversationId) return { ok: false, error: "conversationId required" };
  const channel = asChannel(input.channel);
  if (!channel) return { ok: false, error: "valid channel required" };
  const bodyObj =
    input.body && typeof input.body === "object" && !Array.isArray(input.body)
      ? (input.body as Record<string, unknown>)
      : null;
  const bodyText =
    typeof bodyObj?.text === "string"
      ? bodyObj.text
      : typeof input.text === "string"
        ? input.text
        : typeof input.body === "string"
          ? input.body
          : "";
  if (!bodyText.trim()) return { ok: false, error: "body.text required" };
  const htmlRaw =
    typeof bodyObj?.html === "string"
      ? bodyObj.html
      : typeof input.html === "string"
        ? input.html
        : undefined;
  const bodyHtml =
    typeof htmlRaw === "string" && htmlRaw.trim() ? htmlRaw.trim() : undefined;
  const meta =
    input.meta && typeof input.meta === "object" && !Array.isArray(input.meta)
      ? (input.meta as Record<string, unknown>)
      : undefined;
  let projectId: string | null | undefined;
  if ("projectId" in input) {
    if (input.projectId == null || input.projectId === "") projectId = null;
    else if (typeof input.projectId === "string")
      projectId = input.projectId.trim() || null;
  }
  return {
    ok: true,
    value: {
      conversationId,
      channel,
      bodyText: bodyText.trim(),
      ...(bodyHtml ? { bodyHtml } : {}),
      ...(asParty(input.to) ? { to: asParty(input.to) } : {}),
      ...(asParty(input.from) ? { from: asParty(input.from) } : {}),
      ...(projectId !== undefined ? { projectId } : {}),
      ...(meta ? { meta } : {}),
      ...(input.confirm === true ||
      input.yes === true ||
      input.confirmed === true
        ? { confirm: true }
        : {}),
    },
  };
}

export function parseMessagesOpenInChatInput(
  input: Record<string, unknown>,
):
  | { ok: true; value: MessagesOpenInChatParsed }
  | { ok: false; error: string } {
  return parseMessagesGetInput(input);
}

/** Format envelope for Chat context + composer seed. */
export function formatMessageChatHandoff(
  message: MessagesMcpEnvelope,
): MessageChatHandoff {
  const from =
    message.from?.name || message.from?.address || message.channel || "unknown";
  const preview = message.body.text.replace(/\s+/g, " ").trim().slice(0, 160);
  const subject =
    message.meta && typeof message.meta.subject === "string"
      ? message.meta.subject
      : undefined;
  const contextBlock = [
    "## Message handoff",
    `- id: ${message.id}`,
    `- conversationId: ${message.conversationId}`,
    `- channel: ${message.channel}`,
    `- direction: ${message.direction}`,
    `- status: ${message.status}`,
    `- from: ${from}`,
    ...(subject ? [`- subject: ${subject}`] : []),
    ...(message.projectId ? [`- projectId: ${message.projectId}`] : []),
    "",
    "### Body",
    message.body.text.slice(0, 4000),
  ].join("\n");
  const composerDraft = subject
    ? `Handle this ${message.channel} from ${from} (re: ${subject}):\n\n`
    : `Handle this ${message.channel} from ${from}:\n\n`;
  return {
    messageId: message.id,
    conversationId: message.conversationId,
    channel: message.channel,
    preview,
    contextBlock,
    composerDraft,
    projectId: message.projectId ?? null,
  };
}

export function parseMessageHandoffNav(
  raw: unknown,
): MessageChatHandoff | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const o = raw as Record<string, unknown>;
  const messageId =
    typeof o.messageId === "string" ? o.messageId.trim() : "";
  const conversationId =
    typeof o.conversationId === "string" ? o.conversationId.trim() : "";
  const channel = asChannel(o.channel);
  const preview = typeof o.preview === "string" ? o.preview : "";
  const contextBlock =
    typeof o.contextBlock === "string" ? o.contextBlock : "";
  const composerDraft =
    typeof o.composerDraft === "string" ? o.composerDraft : "";
  if (!messageId || !conversationId || !channel) return undefined;
  return {
    messageId,
    conversationId,
    channel,
    preview,
    contextBlock,
    composerDraft,
    projectId:
      o.projectId === null
        ? null
        : typeof o.projectId === "string"
          ? o.projectId
          : undefined,
  };
}
