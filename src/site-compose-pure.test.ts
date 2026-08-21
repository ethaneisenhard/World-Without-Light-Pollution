import { describe, expect, it } from "vitest";
import {
  articleBlocksFromDoc,
  composeArticleFromMarkdownHtml,
  composeArticlePageHtml,
  composeHomeHeroHtml,
  composeCountyLetterHtml,
  composeLumenLabHtml,
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
  it("renders apostrophes in the hero, not HTML entities", () => {
    const html = composeHomeHeroHtml({
      tagline: "a good night's sleep",
      sourcePath: "content/pages/home.md",
    });
    expect(html).toContain("night's");
    expect(html).not.toContain("&#39;");
    expect(html).not.toContain("&amp;#39;");
  });

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
    expect(html).toContain("Email your county");
    expect(html).not.toContain("Sample letter");
    expect(html).toContain("Learn");
    expect(html).toContain("After lights-out");
    expect(html).toContain("For your town");
    expect(html).toContain("For yourself");
    expect(html).toContain("In your room");
    expect(html).toContain("On your street");
    expect(html).toContain("Tonight");
    expect(html).toContain("pillow");
    expect(html).toContain("without a shade");
    expect(html).not.toContain("cobra-head");
    expect(html).toContain("Learn more about lumens");
    expect(html).not.toContain("See the four kinds");
    const learnCopyIdx = html.indexOf('data-as-instance="home-learn-copy"');
    const learnCtaIdx = html.indexOf('data-as-instance="home-learn-cta"');
    const learnLabIdx = html.indexOf('data-as-instance="home-learn-lab"');
    expect(learnCopyIdx).toBeGreaterThan(-1);
    expect(learnCtaIdx).toBeGreaterThan(learnCopyIdx);
    expect(learnLabIdx).toBeGreaterThan(learnCtaIdx);
    expect(html).toContain("Turn the iPhone red");
    expect(html).toContain('data-nl-embed="iphone"');
    expect(html).toContain('data-nl-embed="town"');
    expect(html).toContain('data-as-instance="home-learn-band"');
    expect(html).toContain('data-as-instance="home-town-band"');
    expect(html).toContain('data-as-instance="home-self-band"');
    const heroContainer = html.match(
      /<div[^>]*data-as-instance="home-container"[^>]*>/,
    )?.[0];
    const learnContainer = html.match(
      /<div[^>]*data-as-instance="home-learn-container"[^>]*>/,
    )?.[0];
    expect(heroContainer).toContain("max-w-6xl");
    expect(heroContainer).toContain("mx-auto");
    expect(learnContainer).toContain("max-w-6xl");
    expect(learnContainer).toContain("mx-auto");
    expect(html).not.toContain('data-as-instance="home-paths-band"');
    const learnBand = html.match(
      /<section[^>]*data-as-instance="home-learn-band"[^>]*>/,
    )?.[0];
    const townBand = html.match(
      /<section[^>]*data-as-instance="home-town-band"[^>]*>/,
    )?.[0];
    const selfBand = html.match(
      /<section[^>]*data-as-instance="home-self-band"[^>]*>/,
    )?.[0];
    expect(learnBand).toContain("bg-sand");
    expect(townBand).toContain("bg-paper-raised");
    expect(selfBand).not.toContain("bg-sand");
    expect(selfBand).not.toContain("bg-paper-raised");
    expect(html).not.toContain("max-w-5xl");
    expect(html).not.toContain("max-w-3xl");
    expect(html).not.toContain("nl-cta");
    const bandOpen = html.match(
      /<section[^>]*data-as-instance="home-band"[^>]*>/,
    )?.[0];
    expect(bandOpen).toBeTruthy();
    expect(bandOpen).not.toContain("bg-paper-raised");
    expect(bandOpen).not.toContain("bg-sand");
    expect(bandOpen).toContain("nl-hero-band");
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

describe("composeCountyLetterHtml", () => {
  it("opens mail and copy with lookup links", () => {
    const html = composeCountyLetterHtml({
      title: "Email your county",
      paragraphs: ["A short note from a neighbor."],
      sourcePath: "content/pages/email-your-county.md",
      siteOrigin: "https://example.com",
    });
    expect(html).toContain("data-nl-county-letter");
    expect(html).toContain("mailto:");
    expect(html).toContain("Open in mail");
    expect(html).toContain("Copy letter");
    expect(html).toContain("data-nl-copy");
    expect(html).toContain("https://example.com/petition");
    expect(html).toContain("usa.gov");
    expect(html).toContain("Find who to write");
    expect(html).toContain('data-as-instance="county-letter-container"');
    const box = html.match(
      /<div class="[^"]*"[^>]*data-as-instance="county-letter-container"/,
    )?.[0];
    expect(box).toBeTruthy();
    expect(box).toContain("mx-auto");
    expect(html).not.toContain("4000K+");
  });
});

describe("composeLumenLabHtml", () => {
  it("puts the lab mount under a short title from content", () => {
    const html = composeLumenLabHtml({
      title: "See what lumens can do",
      intro: "The same lumens can keep the stars or light the road.",
      sourcePath: "content/pages/lumens.md",
    });
    expect(html).toContain('data-as-lumen-lab');
    expect(html).toContain("See what lumens can do");
    expect(html).toContain("The same lumens can keep the stars or light the road.");
    expect(html).toContain('data-as-instance="lumen-lab-title"');
    expect(html).not.toContain("The vocabulary, in plain English");
  });
});

describe("composeArticleFromMarkdownHtml", () => {
  it("interleaves compact lab mounts from [[lab:id]] tokens", () => {
    const html = composeArticleFromMarkdownHtml({
      title: "The problem",
      body: "Skyglow wastes light.\n\n[[lab:skyglow]]\n\nKeep going.",
      sourcePath: "content/pages/what-is-light-pollution.md",
    });
    expect(html).toContain("Skyglow wastes light");
    expect(html).toContain("Keep going.");
    expect(html).toContain("data-as-lumen-lab");
    expect(html).toContain('data-nl-embed="skyglow"');
    expect(html).toContain('data-nl-compact="1"');
    expect(html).toContain('aria-label="Skyglow"');
    expect(html).not.toContain("This playground");
    expect(html).not.toContain("[[lab:skyglow]]");
  });

  it("wraps a heading and its lab in one kind card", () => {
    const html = composeArticleFromMarkdownHtml({
      title: "Kinds",
      body: "### Skyglow\n\nThe dome.\n\n[[lab:skyglow]]\n\n### Glare\n\nBlinds.\n\n[[lab:glare]]",
      sourcePath: "content/pages/what-is-light-pollution.md",
    });
    expect(html).toContain('data-nl-kind="skyglow"');
    expect(html).toContain('data-nl-kind="glare"');
    expect(html.match(/class="nl-kind"/g)?.length).toBe(2);
    expect(html.indexOf("The dome.")).toBeLessThan(html.indexOf('data-nl-embed="skyglow"'));
    expect(html.indexOf('data-nl-embed="skyglow"')).toBeLessThan(html.indexOf("Blinds"));
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
