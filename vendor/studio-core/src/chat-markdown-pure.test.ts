import { describe, expect, it } from "vitest";
import { chatMarkdownToHtml } from "./chat-markdown-pure.js";

describe("chatMarkdownToHtml", () => {
  it("renders headings, bold, and lists", () => {
    const html = chatMarkdownToHtml("# Title\n\nHello **world**.\n\n- one\n- two");
    expect(html).toContain("<h1");
    expect(html).toContain("<strong>world</strong>");
    expect(html).toContain("<li>");
  });

  it("renders GFM tables", () => {
    const html = chatMarkdownToHtml(
      "| Cap | Status |\n| --- | --- |\n| Tables | yes |",
    );
    expect(html).toContain('data-studio-chat-md-table');
    expect(html).toContain('class="as-chat-md-table"');
    expect(html).toContain("<table>");
    expect(html).toContain("<th>");
    expect(html).toContain("Tables");
    expect(html).toContain("yes");
  });

  it("escapes raw HTML / script tags", () => {
    const html = chatMarkdownToHtml(
      'Safe **ok**\n\n<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>',
    );
    expect(html).toContain("<strong>ok</strong>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;img");
  });

  it("returns empty for blank input", () => {
    expect(chatMarkdownToHtml("")).toBe("");
    expect(chatMarkdownToHtml("   \n")).toBe("");
  });

  it("linkifies inline codespan file paths for Code panel", () => {
    const html = chatMarkdownToHtml(
      "Edited `apps/studio/client/studio-ui-classes.ts` — refresh.",
    );
    expect(html).toContain('data-studio-open-file="apps/studio/client/studio-ui-classes.ts"');
    expect(html).toContain('class="as-chat-file-link"');
    expect(html).toContain("<code>");
  });

  it("does not linkify non-path codespans", () => {
    const html = chatMarkdownToHtml("Use `gap-1` and `e.g.` carefully.");
    expect(html).not.toContain("data-studio-open-file");
    expect(html).toContain("<code>gap-1</code>");
  });

  it("linkifies relative markdown file links", () => {
    const html = chatMarkdownToHtml(
      "See [home](content/pages/home.md) for copy.",
    );
    expect(html).toContain('data-studio-open-file="content/pages/home.md"');
    expect(html).toContain("home");
  });

  it("opens bare http(s) URLs in a new browser tab", () => {
    const html = chatMarkdownToHtml(
      "Open https://studio.example.ts.net/?asDcpPreview=1 please",
    );
    expect(html).toContain('href="https://studio.example.ts.net/?asDcpPreview=1"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("opens markdown http(s) links in a new browser tab", () => {
    const html = chatMarkdownToHtml(
      "Open [preview](https://studio.example.ts.net/?asDcpPreview=1)",
    );
    expect(html).toContain('href="https://studio.example.ts.net/?asDcpPreview=1"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain("preview");
  });

  it("soft-breaks flat run-on narration into multiple paragraphs", () => {
    const html = chatMarkdownToHtml(
      "Moving X from Backlog -> Ready. Hmm, cards are separate. Let me check the board.",
    );
    const paragraphs = html.match(/<p>/g) ?? [];
    expect(paragraphs.length).toBeGreaterThanOrEqual(3);
    expect(html).toContain("Ready.");
    expect(html).toContain("Hmm,");
    expect(html).toContain("Let me check");
  });

  it("leaves structured markdown lists unchanged", () => {
    const html = chatMarkdownToHtml("- one\n- two\n\nDone.");
    expect(html).toContain("<li>");
    expect(html).toContain("one");
    expect(html).toContain("two");
  });
});
