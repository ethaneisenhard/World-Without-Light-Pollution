import { describe, expect, it } from "vitest";
import { renderSitePage } from "./render-html.js";

describe("mobile shell — homepage overflow sources", () => {
  it("lets the long brand wrap instead of locking the header row", () => {
    const html = renderSitePage("home", {
      studioPreview: false,
      devSite: false,
    });
    expect(html).toContain("gap-3 px-4 py-4 md:gap-8");
    expect(html).toContain('class="min-w-0"');
    expect(html).not.toContain("min-w-0 shrink-0");
    expect(html).toContain(
      'class="inline-flex max-w-full items-center gap-2.5 no-underline"',
    );
    expect(html).toContain("text-pretty");
  });

  it("keeps the same header contract on a shared inner page", () => {
    const html = renderSitePage("about", {
      studioPreview: false,
      devSite: false,
    });
    expect(html).toContain("gap-3 px-4 py-4 md:gap-8");
    expect(html).not.toContain("min-w-0 shrink-0");
  });
});

describe("prod strip authoring attrs", () => {
  it("strips inspect attrs on non-local non-preview", () => {
    const html = renderSitePage("home", {
      studioPreview: false,
      devSite: false,
    });
    expect(html).not.toContain("data-as-inspect");
    expect(html).not.toContain("data-as-instance");
    expect(html).not.toContain("as-canvas-inspector.js");
    expect(html).toContain('data-as-component="blog-hero"');
    expect(html).toContain("nl-hero-band");
  });

  it("keeps attrs + guest on local ideal-stack preview", () => {
    const html = renderSitePage("home", {
      studioPreview: false,
      devSite: true,
    });
    expect(html).toContain("data-as-inspect");
    expect(html).toContain("data-as-instance");
    expect(html).toContain("as-canvas-inspector.js");
  });

  it("keeps attrs + guest script in Studio preview", () => {
    const html = renderSitePage("home", { studioPreview: true });
    expect(html).toContain("data-as-inspect");
    expect(html).toContain("as-canvas-inspector.js");
  });
});
