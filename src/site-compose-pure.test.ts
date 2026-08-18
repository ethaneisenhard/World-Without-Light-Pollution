import { describe, expect, it } from "vitest";
import {
  articleBlocksFromDoc,
  composeArticlePageHtml,
  composeHomeHeroHtml,
  composeProseArticleHtml,
  homeHeroCopyFromDoc,
} from "./site-compose-pure.js";

describe("homeHeroCopyFromDoc", () => {
  it("uses # title as H1 and first body paragraph as subtitle", () => {
    expect(
      homeHeroCopyFromDoc({
        title: "Ship the work that matters.",
        body: "Northline helps teams ship product without the ceremony.",
      }),
    ).toEqual({
      tagline: "Ship the work that matters.",
      subtitle: "Northline helps teams ship product without the ceremony.",
    });
  });

  it("falls back to body paragraphs when title empty", () => {
    expect(
      homeHeroCopyFromDoc({
        title: "",
        body: "First line\n\nSecond line",
      }),
    ).toEqual({ tagline: "First line", subtitle: "Second line" });
  });
});

describe("articleBlocksFromDoc", () => {
  it("splits title and paragraphs", () => {
    expect(
      articleBlocksFromDoc({
        title: "About",
        body: "First para.\n\nSecond para.",
      }),
    ).toEqual({
      title: "About",
      paragraphs: ["First para.", "Second para."],
    });
  });
});

describe("composeHomeHeroHtml", () => {
  it("composes section → container → blog-hero with Button CTA slots", () => {
    const html = composeHomeHeroHtml({
      tagline: "Ship it",
      subtitle: "Fast",
      sourcePath: "content/pages/home.md",
    });
    expect(html).toContain('data-as-component="section"');
    expect(html).toContain('data-as-instance="home-band"');
    expect(html).toContain('data-as-component="container"');
    expect(html).toContain('data-as-instance="home-container"');
    expect(html).toContain('data-as-component="blog-hero"');
    expect(html).toMatch(/<section[^>]*data-as-component="blog-hero"/);
    expect(html).not.toMatch(/<header[^>]*data-as-component="blog-hero"/);
    expect(html).toContain('data-as-instance="home-hero"');
    expect(html).toContain('data-as-slot="ctaPrimary"');
    expect(html).toContain('data-as-slot="ctaSecondary"');
    expect(html).toContain('data-as-component="button"');
    expect(html).toContain('data-as-component="heading"');
    expect(html).toContain('data-as-component="eyebrow"');
    expect(html).toContain('data-as-instance="home-cta-primary"');
    expect(html).toContain('data-as-instance="home-cta-secondary"');
    expect(html).toContain("Ship it");
    expect(html).toContain("Sign the petition");
    expect(html).not.toContain("max-w-5xl");
    expect(html).not.toContain("max-w-3xl");
    expect(html).not.toContain("nl-cta");
    const bandOpen = html.match(
      /<section[^>]*data-as-instance="home-band"[^>]*>/,
    )?.[0];
    expect(bandOpen).toBeTruthy();
    expect(bandOpen).not.toContain("bg-paper-raised");
    expect(bandOpen).not.toContain("bg-sand");
    expect(bandOpen).toContain("px-4");
    expect(bandOpen).toContain("md:px-8");
    expect(bandOpen).toContain("py-24");
    const heroOpen = html.match(
      /<section[^>]*data-as-component="blog-hero"[^>]*>/,
    )?.[0];
    expect(heroOpen).toBeTruthy();
    expect(heroOpen).not.toContain("bg-paper-raised");
    expect(heroOpen).not.toContain("px-4");
    expect(html).not.toMatch(/data-as-component="blog-hero"[\s\S]*?py-12/);

    const sectionIdx = html.indexOf('data-as-component="section"');
    const containerIdx = html.indexOf('data-as-component="container"');
    const heroIdx = html.indexOf('data-as-component="blog-hero"');
    expect(sectionIdx).toBeGreaterThan(-1);
    expect(containerIdx).toBeGreaterThan(sectionIdx);
    expect(heroIdx).toBeGreaterThan(containerIdx);
  });
});

describe("composeArticlePageHtml", () => {
  it("stamps heading + text primitives (not markdown blob)", () => {
    const html = composeArticlePageHtml({
      title: "About Northline",
      paragraphs: ["We build sites.", "Inspect each block."],
      sourcePath: "content/pages/about.md",
    });
    expect(html).toContain('data-as-component="heading"');
    expect(html).toContain('data-as-instance="article-title"');
    expect(html).toContain('data-as-component="text"');
    expect(html).toContain('data-as-instance="article-p-1"');
    expect(html).toContain('data-as-instance="article-p-2"');
    expect(html).toContain("About Northline");
    expect(html).not.toContain('data-as-kind="markdown"');
  });

  it("renders inline markdown (bold) instead of raw asterisks", () => {
    const html = composeArticlePageHtml({
      title: "**About North**",
      paragraphs: ["**We build** sites."],
      sourcePath: "content/pages/about.md",
    });
    expect(html).toContain("<strong>");
    expect(html).toContain("About North");
    expect(html).not.toContain("**About North**");
    expect(html).not.toContain("**We build**");
  });
});

describe("composeProseArticleHtml", () => {
  it("wraps long-form in prose article", () => {
    const html = composeProseArticleHtml({
      html: "<p>Long blog body</p><ul><li>One</li></ul>",
      sourcePath: "content/posts/hello.md",
    });
    expect(html).toContain('data-as-component="prose"');
    expect(html).toMatch(/<article[^>]*data-as-component="prose"/);
    expect(html).toContain("Long blog body");
  });
});
