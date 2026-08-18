/**
 * CLI harnesses (cursor / hermes) cannot take Anthropic image blocks.
 * Materialize attachments on disk and point the prompt at relative paths
 * so the Host agent can open/read them (vision via file tools).
 */

import {
  chatImageIsReady,
  stripChatImagesForSend,
  type ChatImageAttachment,
  type ChatImageMediaType,
  type ChatTurnMessage,
} from "./chat-pure.js";

export type CliUserTurn = {
  content: string;
  images: ChatImageAttachment[];
};

/** Last user turn — text and/or ready images (image-only OK). */
export function findLastCliUserTurn(
  messages: readonly ChatTurnMessage[],
): CliUserTurn | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]!;
    if (m.role !== "user") continue;
    const images = stripChatImagesForSend(m.images).filter(chatImageIsReady);
    const content = m.content?.trim() ?? "";
    if (!content && !images.length) continue;
    return { content, images };
  }
  return null;
}

export function chatImageFileExtension(mediaType: ChatImageMediaType): string {
  if (mediaType === "image/jpeg") return "jpg";
  if (mediaType === "image/png") return "png";
  if (mediaType === "image/gif") return "gif";
  return "webp";
}

/** Project-relative path for one attachment under `.scratch/chat-attachments/`. */
export function chatAttachmentRelPath(input: {
  turnId: string;
  index: number;
  mediaType: ChatImageMediaType;
  name?: string;
}): string {
  const turn = input.turnId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48) || "turn";
  const n = String(input.index + 1).padStart(2, "0");
  const ext = chatImageFileExtension(input.mediaType);
  const base =
    input.name
      ?.replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || `image-${n}`;
  return `.scratch/chat-attachments/${turn}/${base}.${ext}`;
}

/**
 * Prompt body for Host CLI agents: list disk paths then user text.
 * Paths must be project-relative so Read/open tools resolve under cwd.
 */
export function formatCliHarnessUserPrompt(input: {
  userText: string;
  attachmentPaths: readonly string[];
}): string {
  const text = input.userText.trim();
  const paths = input.attachmentPaths.filter((p) => p.trim());
  if (!paths.length) {
    return text || "(empty)";
  }
  const list = paths.map((p) => `- ${p}`).join("\n");
  const header = [
    "User attached image(s) as files in this project workspace.",
    "REQUIRED before you reply: call Studio MCP tool studio.vision.describe on EACH path below (preferred) — or open the file with Read if that tool can show pixels.",
    "Do not say you cannot see the image, cannot see the screen, or that no image was attached — the files are on disk under these paths.",
    "If studio.vision.describe fails (auth/MCP), say that Host vision failed and quote the error — do not invent what the screenshot shows.",
    "Paths (project-relative; cwd is the project root):",
    list,
  ].join("\n");
  if (!text) return header;
  return `${header}\n\n${text}`;
}
