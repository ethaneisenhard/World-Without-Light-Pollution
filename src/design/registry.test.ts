import { describe, expect, it } from "vitest";
import {
  buildPermutationCards,
  createDefaultDraft,
  getDesignComponent,
  renderWithDraft,
} from "./registry.js";

describe("design registry", () => {
  it("loads blog-hero meta with slots", () => {
    const meta = getDesignComponent("blog-hero");
    expect(meta?.title).toBe("Blog hero");
    expect(meta?.slots?.title).toBeTruthy();
    expect(meta?.props.layout?.type).toBe("enum");
  });

  it("renders section with draft props + children", () => {
    const draft = createDefaultDraft("section");
    draft.props.background = "muted";
    draft.children = "Hello";
    const html = renderWithDraft("section", draft);
    expect(html).toContain('data-as-component="section"');
    expect(html).toContain("as-ds-shell");
    expect(html).toContain("border-dashed");
    expect(html).toContain("bg-sand");
    expect(html).toContain("Hello");
  });

  it("renders container as max-width shell only", () => {
    const draft = createDefaultDraft("container");
    const html = renderWithDraft("container", draft);
    expect(html).toContain('data-as-component="container"');
    expect(html).toContain("as-ds-shell");
    expect(html).toContain("border-dashed");
    expect(html).toContain("px-6");
    expect(html).toContain("max-w-7xl");
    expect(html).toContain("mx-auto");
    expect(html).not.toContain("· layout");
    expect(html).not.toContain("flex-col");
    expect(html).not.toContain("md:flex-row");
  });

  it("renders flex with row-wrap demo cells", () => {
    const draft = createDefaultDraft("flex");
    const html = renderWithDraft("flex", draft);
    expect(html).toContain('data-as-component="flex"');
    expect(html).toContain('data-as-flex-demo="row-wrap"');
    expect(html).toContain("flex-wrap");
    expect(html).toContain("data-as-layout-demo-cell");
    expect(html).toContain(">3<");
  });

  it("renders grid calendar demo as 7-col", () => {
    const draft = createDefaultDraft("grid");
    draft.props.demo = "calendar";
    const html = renderWithDraft("grid", draft);
    expect(html).toContain('data-as-grid-demo="calendar"');
    expect(html).toContain("grid-cols-7");
    expect(html).toContain(">31<");
  });

  it("renders headless button with label slot + variant", () => {
    const draft = createDefaultDraft("button");
    draft.props.variant = "secondary";
    draft.slotText.label = "Continue";
    const html = renderWithDraft("button", draft);
    expect(html).toContain('data-as-component="button"');
    expect(html).toContain('data-variant="secondary"');
    expect(html).toContain('data-as-slot="label"');
    expect(html).toContain("Continue");
  });

  it("permutations share draft slot text", () => {
    const draft = createDefaultDraft("blog-hero");
    draft.slotText.title = "Shared title across cards";
    const cards = buildPermutationCards("blog-hero", draft);
    expect(cards).toHaveLength(3);
    expect(
      cards.every((c) => c.html.includes("Shared title across cards")),
    ).toBe(true);
    expect(cards.map((c) => c.value).sort()).toEqual([
      "backdrop",
      "magazine",
      "side",
    ]);
  });
});
