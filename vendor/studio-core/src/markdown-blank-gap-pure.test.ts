import { describe, expect, it } from "vitest";
import {
  bodyAfterHeading,
  decodeBlankGapsFromProseMirror,
  encodeBlankGapsForProseMirror,
  MD_BLANK_GAP_MARKER,
} from "./markdown-blank-gap-pure.js";
import { expandMarkdownBlankGaps, markdownToHtml } from "./markdown-pure.js";

describe("markdown blank gaps", () => {
  it("encode → decode restores extra blank lines", () => {
    const src = "# Ab\n\n\n\nHello\n\n\n\nWorld";
    const encoded = encodeBlankGapsForProseMirror(src);
    expect(encoded).toContain(MD_BLANK_GAP_MARKER);
    const decoded = decodeBlankGapsFromProseMirror(encoded);
    expect(expandMarkdownBlankGaps(decoded)).toContain('class="as-md-gap"');
    expect(markdownToHtml(decoded)).toContain('class="as-md-gap"');
  });

  it("bodyAfterHeading keeps leading blank lines after title", () => {
    // `# Ab\n\n\n\nHello` = two blank lines under title; peel heading + one \n → `\n\n\nHello`.
    const { title, body } = bodyAfterHeading("# Ab\n\n\n\nHello\n");
    expect(title).toBe("Ab");
    expect(body.startsWith("\n\n\nHello")).toBe(true);
    expect(body.trim()).toBe("Hello");
  });

  it("normal single blank line unchanged", () => {
    const src = "# Ab\n\nHello";
    expect(encodeBlankGapsForProseMirror(src)).toBe(src);
  });
});
