import { describe, expect, it } from "vitest";
import {
  clampWorkspaceIconPickerPosition,
  filterWorkspaceBrandEmojiCatalog,
  normalizeBrandEmoji,
  WORKSPACE_BRAND_EMOJI_CATALOG,
} from "./workspace-brand-emoji-pure.js";

describe("normalizeBrandEmoji", () => {
  it("keeps a single emoji grapheme", () => {
    expect(normalizeBrandEmoji("🚀")).toBe("🚀");
    expect(normalizeBrandEmoji("  🦊 extra ")).toBe("🦊");
  });

  it("rejects initials-shaped text and empty", () => {
    expect(normalizeBrandEmoji("SS")).toBeNull();
    expect(normalizeBrandEmoji("iw")).toBeNull();
    expect(normalizeBrandEmoji("")).toBeNull();
    expect(normalizeBrandEmoji(null)).toBeNull();
  });
});

describe("filterWorkspaceBrandEmojiCatalog", () => {
  it("returns the full catalog when query is empty", () => {
    expect(filterWorkspaceBrandEmojiCatalog("")).toBe(WORKSPACE_BRAND_EMOJI_CATALOG);
  });

  it("filters by keyword", () => {
    const rows = filterWorkspaceBrandEmojiCatalog("rocket");
    expect(rows.some((r) => r.emoji === "🚀")).toBe(true);
    expect(rows.length).toBeLessThan(WORKSPACE_BRAND_EMOJI_CATALOG.length);
  });

  it("accepts a pasted emoji even if not in the catalog", () => {
    const rows = filterWorkspaceBrandEmojiCatalog("🎸");
    expect(rows).toEqual([{ emoji: "🎸", keywords: ["custom"] }]);
  });
});

describe("clampWorkspaceIconPickerPosition", () => {
  it("keeps the panel inside the viewport", () => {
    expect(
      clampWorkspaceIconPickerPosition({
        x: 2000,
        y: 2000,
        width: 280,
        height: 340,
        viewportWidth: 800,
        viewportHeight: 600,
      }),
    ).toEqual({ left: 512, top: 252 });
  });
});
