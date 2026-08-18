/**
 * Workspace brand emoji — user mark in design.json (not chrome Heroicons).
 * Initials stay the fallback when emoji is cleared.
 */

export type WorkspaceBrandEmojiRow = {
  emoji: string;
  keywords: readonly string[];
};

/** Curated picker set — search by keyword; paste still goes through normalize. */
export const WORKSPACE_BRAND_EMOJI_CATALOG: readonly WorkspaceBrandEmojiRow[] = [
  { emoji: "🚀", keywords: ["rocket", "launch", "ship"] },
  { emoji: "💡", keywords: ["idea", "light", "lamp"] },
  { emoji: "🧪", keywords: ["lab", "test", "science"] },
  { emoji: "🎨", keywords: ["art", "design", "paint"] },
  { emoji: "📝", keywords: ["notes", "write", "memo"] },
  { emoji: "📚", keywords: ["books", "docs", "read"] },
  { emoji: "🗂️", keywords: ["files", "folder", "organize"] },
  { emoji: "📁", keywords: ["folder", "files"] },
  { emoji: "🏡", keywords: ["home", "house"] },
  { emoji: "🌐", keywords: ["web", "globe", "site"] },
  { emoji: "💬", keywords: ["chat", "talk", "message"] },
  { emoji: "🤖", keywords: ["robot", "bot", "ai"] },
  { emoji: "🧠", keywords: ["brain", "think", "memory"] },
  { emoji: "⚡", keywords: ["bolt", "fast", "energy"] },
  { emoji: "🔥", keywords: ["fire", "hot"] },
  { emoji: "🌟", keywords: ["star", "glow"] },
  { emoji: "⭐", keywords: ["star"] },
  { emoji: "🎯", keywords: ["target", "goal"] },
  { emoji: "🛠️", keywords: ["tools", "build", "fix"] },
  { emoji: "🧰", keywords: ["toolbox", "kit"] },
  { emoji: "💻", keywords: ["laptop", "code", "dev"] },
  { emoji: "🖥️", keywords: ["desktop", "computer"] },
  { emoji: "📱", keywords: ["phone", "mobile"] },
  { emoji: "🧩", keywords: ["puzzle", "piece"] },
  { emoji: "🧲", keywords: ["magnet"] },
  { emoji: "🔑", keywords: ["key", "secret"] },
  { emoji: "🔒", keywords: ["lock", "secure"] },
  { emoji: "📦", keywords: ["box", "package"] },
  { emoji: "🛒", keywords: ["cart", "shop"] },
  { emoji: "📰", keywords: ["news", "blog"] },
  { emoji: "🎬", keywords: ["film", "media"] },
  { emoji: "🎵", keywords: ["music", "audio"] },
  { emoji: "📷", keywords: ["camera", "photo"] },
  { emoji: "🗺️", keywords: ["map", "travel"] },
  { emoji: "🌱", keywords: ["plant", "grow"] },
  { emoji: "🍀", keywords: ["clover", "luck"] },
  { emoji: "🌸", keywords: ["flower", "bloom"] },
  { emoji: "🌈", keywords: ["rainbow", "color"] },
  { emoji: "🌙", keywords: ["moon", "night"] },
  { emoji: "☀️", keywords: ["sun", "day"] },
  { emoji: "☁️", keywords: ["cloud"] },
  { emoji: "❄️", keywords: ["snow", "cold"] },
  { emoji: "🦊", keywords: ["fox"] },
  { emoji: "🐱", keywords: ["cat"] },
  { emoji: "🐶", keywords: ["dog"] },
  { emoji: "🐼", keywords: ["panda"] },
  { emoji: "🦄", keywords: ["unicorn"] },
  { emoji: "🐙", keywords: ["octopus"] },
  { emoji: "🐝", keywords: ["bee"] },
  { emoji: "💚", keywords: ["green", "heart"] },
  { emoji: "💙", keywords: ["blue", "heart"] },
  { emoji: "💜", keywords: ["purple", "heart"] },
  { emoji: "🧡", keywords: ["orange", "heart"] },
  { emoji: "💛", keywords: ["yellow", "heart"] },
  { emoji: "❤️", keywords: ["red", "heart"] },
  { emoji: "✅", keywords: ["check", "done"] },
  { emoji: "📌", keywords: ["pin"] },
  { emoji: "🏷️", keywords: ["tag", "label"] },
];

const LETTERS_ONLY = /^[A-Za-z0-9]{1,3}$/;

/** First grapheme; empty / initials-shaped strings are not emoji. */
export function normalizeBrandEmoji(
  raw: string | null | undefined,
): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  let first = s;
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
    const seg = new Intl.Segmenter("en", { granularity: "grapheme" });
    first = [...seg.segment(s)][0]?.segment ?? "";
  }
  if (!first || first.length > 16) return null;
  if (LETTERS_ONLY.test(first)) return null;
  return first;
}

export function filterWorkspaceBrandEmojiCatalog(
  query: string,
): readonly WorkspaceBrandEmojiRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return WORKSPACE_BRAND_EMOJI_CATALOG;
  const pasted = normalizeBrandEmoji(query);
  if (pasted && pasted === query.trim()) {
    const hit = WORKSPACE_BRAND_EMOJI_CATALOG.filter((row) => row.emoji === pasted);
    if (hit.length > 0) return hit;
    return [{ emoji: pasted, keywords: ["custom"] }];
  }
  return WORKSPACE_BRAND_EMOJI_CATALOG.filter((row) => {
    if (row.emoji.includes(q)) return true;
    return row.keywords.some((k) => k.includes(q) || q.includes(k));
  });
}

export function clampWorkspaceIconPickerPosition(input: {
  x: number;
  y: number;
  width: number;
  height: number;
  viewportWidth: number;
  viewportHeight: number;
}): { left: number; top: number } {
  const pad = 8;
  const maxLeft = Math.max(pad, input.viewportWidth - input.width - pad);
  const maxTop = Math.max(pad, input.viewportHeight - input.height - pad);
  return {
    left: Math.min(Math.max(pad, Math.round(input.x)), maxLeft),
    top: Math.min(Math.max(pad, Math.round(input.y)), maxTop),
  };
}
