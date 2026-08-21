import { describe, expect, it } from "vitest";
import { renderSitePage } from "./render-html.js";

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
