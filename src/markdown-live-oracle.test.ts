/**
 * Bulletproof gates: Code Write/Source and Website Preview share one MD→HTML engine,
 * and compiled CSS must paint paragraph + blank-line rhythm (Tailwind preflight zeros `p`).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { markdownToSimpleHtml } from "./md-pure.js";
import { composeArticleFromMarkdownHtml } from "./site-compose-pure.js";
import { renderSitePage } from "./render-html.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("markdown Live oracle (Write/Source ↔ Preview)", () => {
  it("single newlines become <br> (breaks:true)", () => {
    const html = markdownToSimpleHtml("Line one\nLine two");
    expect(html).toMatch(/Line one\s*<br\s*\/?>\s*Line two/i);
  });

  it("extra blank lines become as-md-gap spacers", () => {
    const html = markdownToSimpleHtml("Para one\n\n\n\nPara two");
    expect(html).toContain('class="as-md-gap"');
    expect(html).toContain("<p>Para one</p>");
    expect(html).toContain("<p>Para two</p>");
  });

  it("article compose always uses prose (not primitive fork)", () => {
    const html = composeArticleFromMarkdownHtml({
      title: "About",
      body: "First.\n\nSecond.\n\n\nThird.",
      sourcePath: "content/pages/about.md",
    });
    expect(html).toContain('data-as-component="prose"');
    expect(html).toContain('class="as-md-gap"');
    expect(html).toContain("<p>First.</p>");
    expect(html).toContain("<p>Second.</p>");
    expect(html).toContain("<p>Third.</p>");
    expect(html).not.toContain('data-as-instance="article-p-1"');
  });

  it("renderSitePage(about) uses draft body through prose path", () => {
    const draft = `---
title: About
---
# About

Alpha

Bravo
Charlie

`;
    const html = renderSitePage("about", {
      getDraft: (path) =>
        path === "content/pages/about.md" ? draft : undefined,
      studioPreview: true,
    });
    expect(html).toContain('data-as-component="prose"');
    expect(html).toContain("Alpha");
    expect(html).toContain("Bravo");
    expect(html).toMatch(/Bravo\s*<br\s*\/?>\s*Charlie/i);
  });

  it("keeps extra blank lines after title as as-md-gap on Live", () => {
    const draft = `---
title: Ab
---
# Ab



*Hello gap*
`;
    const html = renderSitePage("about", {
      getDraft: (path) =>
        path === "content/pages/about.md" ? draft : undefined,
      studioPreview: true,
    });
    expect(html).toContain('class="as-md-gap"');
    expect(html).toContain("Hello gap");
  });

  it("media: images use APP_ORIGIN (not Host localhost) for Live img src", () => {
    const prev = process.env.APP_ORIGIN;
    process.env.APP_ORIGIN = "https://glassbox-studio.devbyethan.workers.dev";
    try {
      const html = composeArticleFromMarkdownHtml({
        title: "About",
        body: "![Shot](media:photo-1)\n\nCaption.",
        sourcePath: "content/pages/about.md",
        projectId: "glassbox-studio-template",
      });
      expect(html).toContain(
        'src="https://glassbox-studio.devbyethan.workers.dev/api/projects/glassbox-studio-template/media/photo-1',
      );
      expect(html).not.toContain("127.0.0.1:3847");
    } finally {
      if (prev === undefined) delete process.env.APP_ORIGIN;
      else process.env.APP_ORIGIN = prev;
    }
  });

  it("built styles.css paints prose p margins + as-md-gap (run pnpm build:css)", () => {
    const css = readFileSync(join(root, "public/styles.css"), "utf8");
    expect(css, "missing as-md-gap — fix @source to packages/library/components").toMatch(
      /as-md-gap/,
    );
    expect(css).toMatch(/as-md-gap\\\]\\:h-[68]|as-md-gap]:h-[68]/);
    // Nested [&_p]:my-6 compiled form
    expect(css, "missing [&_p]:my-6 — prose spacing dead under preflight").toMatch(
      /\\\[\\\&_p\\\]\\:my-6|\\&_p\\\]\\:my-6/,
    );
  });
});
