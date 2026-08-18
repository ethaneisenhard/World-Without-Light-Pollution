import { describe, expect, it } from "vitest";
import { stampSlotOntoHtml } from "./inspect-stamp.js";

describe("stampSlotOntoHtml", () => {
  it("merges slot attrs onto a single semantic root", () => {
    const html = stampSlotOntoHtml({
      componentId: "blog-hero",
      slot: "title",
      html: `<h1 class="font-display text-5xl">Ship it</h1>`,
    });
    expect(html).toMatch(/^<h1 /);
    expect(html).toContain('data-as-kind="slot"');
    expect(html).toContain('data-as-component="blog-hero"');
    expect(html).toContain('data-as-slot="title"');
    expect(html).toContain("Ship it");
    expect(html).not.toContain("<div data-as");
  });

  it("wraps multi-root HTML in a div slot host", () => {
    const html = stampSlotOntoHtml({
      componentId: "blog-hero",
      slot: "byline",
      html: `<a href="/a">A</a><a href="/b">B</a>`,
    });
    expect(html).toContain("<div ");
    expect(html).toContain('data-as-slot="byline"');
    expect(html).toContain('<a href="/a">');
  });

  it("wraps nested Button primitive instead of overwriting its component id", () => {
    const html = stampSlotOntoHtml({
      componentId: "blog-hero",
      slot: "ctaPrimary",
      html: `<a href="/contact" data-as-inspect="1" data-as-kind="component" data-as-component="button"><span>Go</span></a>`,
    });
    expect(html).toContain('data-as-slot="ctaPrimary"');
    expect(html).toContain('data-as-component="button"');
    expect(html).toContain('class="contents"');
    // Slot host uses blog-hero; button keeps its own component id
    expect(html).toMatch(
      /data-as-component="blog-hero"[^>]*>[\s\S]*data-as-component="button"/,
    );
  });
});
