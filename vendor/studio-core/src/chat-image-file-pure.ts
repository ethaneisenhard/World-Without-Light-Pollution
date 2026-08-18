/**
 * Client File / clipboard → allowlisted chat image media type.
 * Sniff name when MIME empty (Finder drag / some WebViews).
 */

import {
  isChatImageMediaType,
  type ChatImageMediaType,
} from "./chat-pure.js";

export type ChatImageFileLike = {
  type: string;
  name?: string;
};

export type ChatImageFileAccept =
  | { ok: true; mediaType: ChatImageMediaType }
  | { ok: false; reason: string };

/** Extension → allowlisted type (lowercase name). */
export function chatImageMediaTypeFromName(
  name: string | undefined,
): ChatImageMediaType | null {
  const lower = (name ?? "").trim().toLowerCase();
  if (!lower) return null;
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  return null;
}

/**
 * Resolve a browser File (or clipboard file) to a sendable media type.
 * Empty MIME + screenshot.png → png. TIFF/HEIC → explicit reject (not silent).
 */
export function acceptChatImageFile(
  file: ChatImageFileLike,
): ChatImageFileAccept {
  const rawType = (file.type ?? "").trim().toLowerCase();
  if (rawType && isChatImageMediaType(rawType)) {
    return { ok: true, mediaType: rawType };
  }
  if (rawType === "image/jpg") {
    return { ok: true, mediaType: "image/jpeg" };
  }
  const fromName = chatImageMediaTypeFromName(file.name);
  if (fromName) {
    // Empty or wrong MIME but known extension — common Finder / Tauri drop.
    if (!rawType || rawType === "application/octet-stream") {
      return { ok: true, mediaType: fromName };
    }
  }
  if (rawType.startsWith("image/")) {
    return {
      ok: false,
      reason: `Unsupported image type "${rawType}". Use PNG, JPEG, GIF, or WebP.`,
    };
  }
  if ((file.name ?? "").trim()) {
    return {
      ok: false,
      reason: `"${file.name}" is not a PNG/JPEG/GIF/WebP image.`,
    };
  }
  return {
    ok: false,
    reason: "Unsupported file — attach a PNG, JPEG, GIF, or WebP screenshot.",
  };
}

export type FilterChatImageFilesResult = {
  accepted: Array<{ file: ChatImageFileLike; mediaType: ChatImageMediaType }>;
  /** Human message when user offered files but none can attach (never silent). */
  error: string | null;
};

/** Filter FileList-like inputs; always surface a banner when all rejected. */
export function filterChatImageFiles(
  files: readonly ChatImageFileLike[],
): FilterChatImageFilesResult {
  if (!files.length) {
    return { accepted: [], error: null };
  }
  const accepted: FilterChatImageFilesResult["accepted"] = [];
  const reasons: string[] = [];
  for (const file of files) {
    const r = acceptChatImageFile(file);
    if (r.ok) {
      accepted.push({ file, mediaType: r.mediaType });
    } else {
      reasons.push(r.reason);
    }
  }
  if (accepted.length) {
    return { accepted, error: null };
  }
  // Prefer first concrete reason; avoid dumping N identical lines.
  const unique = [...new Set(reasons)];
  return {
    accepted: [],
    error:
      unique[0] ??
      "Could not attach that file — use PNG, JPEG, GIF, or WebP.",
  };
}
