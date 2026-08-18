import { describe, expect, it } from "vitest";
import { expandMarkdownBlankGaps, markdownToHtml } from "./markdown-pure.js";

describe("markdownToHtml (marked)", () => {
  it("renders headings, paragraphs, and emphasis", () => {
    const html = markdownToHtml("# About\n\nHello **world**.\n\n*italic*");
    expect(html).toContain("<h1");
    expect(html).toContain("About");
    expect(html).toContain("<strong>world</strong>");
    expect(html).toContain("<em>italic</em>");
  });

  it("renders GFM lists and links", () => {
    const html = markdownToHtml("- one\n- two\n\n[docs](https://example.com)");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>");
    expect(html).toContain('href="https://example.com"');
  });

  it("empty / whitespace → empty string", () => {
    expect(markdownToHtml("")).toBe("");
    expect(markdownToHtml("   \n")).toBe("");
  });

  it("rewrites media: images to optimized srcset", () => {
    const html = markdownToHtml("![Hero](media:photo-1)", {
      apiOrigin: "http://127.0.0.1:3847",
      defaultProjectId: "glassbox-studio-template",
    });
    expect(html).toContain('data-as-component="optimized-image"');
    expect(html).toContain(
      "http://127.0.0.1:3847/api/projects/glassbox-studio-template/media/photo-1",
    );
    expect(html).toContain("fm=webp");
    expect(html).toContain("srcset=");
  });

  it("wraps media:pct images at display percent", () => {
    const html = markdownToHtml("![Hero](media:photo-1?pct=40)", {
      defaultProjectId: "glassbox-studio-template",
    });
    expect(html).toContain('class="as-prose-image-wrap"');
    expect(html).toContain('style="width:40%"');
    expect(html).toContain("w=480"); // 40% of 1200 measure
  });

  it("preserves extra blank lines as gap spacers", () => {
    expect(expandMarkdownBlankGaps("a\n\n\n\nb")).toContain('class="as-md-gap"');
    const html = markdownToHtml("Para one\n\n\n\nPara two");
    expect(html).toContain('class="as-md-gap"');
    expect(html).toContain("Para one");
    expect(html).toContain("Para two");
  });

  it("turns single newlines into hard breaks", () => {
    const html = markdownToHtml("Line one\nLine two");
    expect(html).toMatch(/Line one\s*<br\s*\/?>\s*Line two/i);
  });
});
