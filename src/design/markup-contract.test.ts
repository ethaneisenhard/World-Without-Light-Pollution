import { describe, expect, it } from "vitest";
import {
  createDefaultDraft,
  listDesignComponents,
  renderWithDraft,
  type DesignComponentId,
} from "./registry.js";
import { composeHomeHeroHtml } from "../site-compose-pure.js";

const REQUIRED_COMPONENT_ATTRS = [
  'data-as-inspect="1"',
  'data-as-kind="component"',
  'data-as-component=',
] as const;

describe("design markup contract (tokens-and-markup.mdc)", () => {
  it("every registry component stamps full inspect attrs", () => {
    for (const meta of listDesignComponents()) {
      const id = meta.id as DesignComponentId;
      const draft = createDefaultDraft(id);
      const html = renderWithDraft(id, draft);
      expect(html, id).toBeTruthy();
      for (const attr of REQUIRED_COMPONENT_ATTRS) {
        expect(html, `${id} missing ${attr}`).toContain(attr);
      }
      expect(html, `${id} missing component id`).toContain(
        `data-as-component="${id}"`,
      );
    }
  });

  it("section uses landmark <section>; button uses <button> or <a>", () => {
    const section = renderWithDraft("section", createDefaultDraft("section"));
    expect(section).toMatch(/<section[^>]*data-as-component="section"/);

    const button = renderWithDraft("button", createDefaultDraft("button"));
    expect(button).toMatch(/<(button|a)[^>]*data-as-component="button"/);
  });

  it("blog-hero is <section> and stamps typography primitives in slots", () => {
    const draft = createDefaultDraft("blog-hero");
    draft.slotText.title = "Readable title";
    const html = renderWithDraft("blog-hero", draft)!;
    expect(html).toMatch(/<section[^>]*data-as-component="blog-hero"/);
    expect(html).toContain('data-as-component="heading"');
    expect(html).toContain('data-as-slot="title"');
    expect(html).toContain("Readable title");
  });

  it("live home compose stamps instances on the full tree", () => {
    const html = composeHomeHeroHtml({
      tagline: "Ship it",
      subtitle: "Fast",
      sourcePath: "content/pages/home.md",
    });
    expect(html).toContain('data-as-instance="home-band"');
    expect(html).toContain('data-as-instance="home-container"');
    expect(html).toContain('data-as-instance="home-hero"');
    expect(html).toContain('data-as-instance="home-cta-primary"');
    expect(html).toContain('data-as-slot="ctaPrimary"');
    expect(html).toContain('data-as-component="heading"');
    expect(html).toContain('data-as-component="eyebrow"');
    expect(html).toContain('data-as-component="text"');
    expect(html).toMatch(/<section[^>]*data-as-component="blog-hero"/);
    expect(html).not.toMatch(/<header[^>]*data-as-component="blog-hero"/);
  });
});
