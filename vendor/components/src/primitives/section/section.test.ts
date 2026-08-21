import { describe, expect, it } from "vitest";
import { renderSection } from "./section.js";

describe("renderSection", () => {
  it("defaults to lg gutters including side pad", () => {
    const html = renderSection({
      props: { instanceId: "band" },
      children: "Hi",
      chrome: "live",
    });
    expect(html).toContain('data-as-component="section"');
    expect(html).toContain("px-4");
    expect(html).toContain("md:px-8");
    expect(html).toContain("py-16");
    expect(html).toContain("Hi");
  });

  it("padding none is full-bleed (no gutters)", () => {
    const html = renderSection({
      props: { padding: "none" },
      children: "Edge",
      chrome: "live",
    });
    expect(html).not.toContain("px-4");
    expect(html).not.toContain("py-");
  });

  it("xl scales vertical while keeping side gutters", () => {
    const html = renderSection({
      props: { padding: "xl", background: "muted" },
      children: "Hero",
      chrome: "live",
    });
    expect(html).toContain("px-4");
    expect(html).toContain("md:px-8");
    expect(html).toContain("py-24");
    expect(html).toContain("bg-sand");
  });

  it("appends className for visitor paint", () => {
    const html = renderSection({
      props: { className: "nl-hero-band", instanceId: "home-band" },
      children: "Sky",
      chrome: "live",
    });
    expect(html).toContain("nl-hero-band");
    expect(html).toContain("Sky");
  });
});
