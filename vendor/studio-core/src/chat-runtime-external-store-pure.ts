/**
 * ExternalStore-shaped projection of a chat session runtime (assistant-ui /
 * TanStack AI headless pattern — UI reads this; Host/SSE stay behind the runtime).
 *
 * Studio wires this via `chat-session-runtimes` → imperative log/composer hosts.
 * Do not grow Remix Handle state from these fields.
 */

export type ChatRuntimeExternalMessage = {
  role: "user" | "assistant" | "error";
  content: string;
};

export type ChatRuntimeExternalStore = {
  sessionId: string;
  messages: readonly ChatRuntimeExternalMessage[];
  streaming: boolean;
  streamStatus: string | null;
  composerInput: string;
  queuedCount: number;
};

export type ProjectChatRuntimeExternalStoreInput = {
  sessionId: string | null | undefined;
  chatLog: ReadonlyArray<{
    role?: string | null;
    content?: string | null;
  } | null>;
  streaming: boolean;
  streamStatus?: string | null;
  composerInput?: string | null;
  queuedMessages?: ReadonlyArray<unknown> | null;
};

/** Project runtime actor state into a UI-facing ExternalStore snapshot. */
export function projectChatRuntimeExternalStore(
  input: ProjectChatRuntimeExternalStoreInput,
): ChatRuntimeExternalStore {
  const sessionId = input.sessionId?.trim() || "";
  const messages: ChatRuntimeExternalMessage[] = [];
  for (const row of input.chatLog ?? []) {
    if (!row) continue;
    const role = row.role;
    if (role !== "user" && role !== "assistant" && role !== "error") continue;
    messages.push({
      role,
      content: typeof row.content === "string" ? row.content : "",
    });
  }
  return {
    sessionId,
    messages,
    streaming: Boolean(input.streaming),
    streamStatus: input.streamStatus?.trim() || null,
    composerInput: input.composerInput ?? "",
    queuedCount: input.queuedMessages?.length ?? 0,
  };
}
