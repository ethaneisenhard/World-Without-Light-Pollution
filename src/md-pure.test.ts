import { describe, expect, it } from "vitest";
import {
  headingSlug,
  markdownToInlineHtml,
  markdownToSimpleHtml,
  stampMarkdownHeadingAnchors,
} from "./md-pure.js";

describe("markdownToSimpleHtml", () => {
  it("renders heading, paragraphs, and bold via marked", () => {
    const html = markdownToSimpleHtml(
      "# About\n\nHello **world**.\n\nSecond.",
    );
    expect(html).toContain("<h1");
    expect(html).toContain('id="about"');
    expect(html).toContain('href="#about"');
    expect(html).toContain("About");
    expect(html).toContain("<strong>world</strong>");
    expect(html).toContain("<p>Second.</p>");
  });
});

describe("headingSlug", () => {
  it("strips quotes and punctuation for shareable hashes", () => {
    expect(headingSlug('Myth: "More light means more safety"')).toBe(
      "myth-more-light-means-more-safety",
    );
    expect(headingSlug("At home — phone, TV, kitchen")).toBe(
      "at-home-phone-tv-kitchen",
    );
    expect(headingSlug("iPhone: red screen on a triple-click")).toBe(
      "iphone-red-screen-on-a-triple-click",
    );
  });
});

describe("stampMarkdownHeadingAnchors", () => {
  it("dedupes duplicate heading slugs", () => {
    const html = stampMarkdownHeadingAnchors("<h2>Skyglow</h2><h2>Skyglow</h2>");
    expect(html).toContain('id="skyglow"');
    expect(html).toContain('id="skyglow-2"');
  });
});

describe("markdownToInlineHtml", () => {
  it("unwraps a single paragraph for hero lines", () => {
    expect(markdownToInlineHtml("**bold** and *italic*")).toBe(
      "<strong>bold</strong> and <em>italic</em>",
    );
  });

  it("keeps apostrophes as characters so headings do not show entities", () => {
    expect(markdownToInlineHtml("a good night's sleep")).toBe(
      "a good night's sleep",
    );
  });
});
