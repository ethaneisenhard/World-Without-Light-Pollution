import { describe, expect, it } from "vitest";
import { markdownToSimpleHtml, markdownToInlineHtml } from "./md-pure.js";

describe("markdownToSimpleHtml", () => {
  it("renders heading, paragraphs, and bold via marked", () => {
    const html = markdownToSimpleHtml(
      "# About\n\nHello **world**.\n\nSecond.",
    );
    expect(html).toContain("<h1");
    expect(html).toContain("About");
    expect(html).toContain("<strong>world</strong>");
    expect(html).toContain("<p>Second.</p>");
  });
});

describe("markdownToInlineHtml", () => {
  it("unwraps a single paragraph for hero lines", () => {
    expect(markdownToInlineHtml("**bold** and *italic*")).toBe(
      "<strong>bold</strong> and <em>italic</em>",
    );
  });
});
