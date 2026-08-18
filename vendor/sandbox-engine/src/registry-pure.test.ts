import { describe, expect, it } from "vitest";
import type { DesignComponentMeta } from "@glassbox-studio/studio-core/browser";
import { createSandboxRegistry } from "./registry-pure.js";
import { mergeDraft } from "./draft-pure.js";
import { renderSandboxApiPayload } from "./html/shell-pure.js";

const sectionMeta = {
  id: "section",
  title: "Section",
  layer: "primitive",
  acceptsChildren: true,
  props: {
    background: {
      type: "enum",
      values: ["transparent", "muted"],
      default: "transparent",
      title: "Background",
    },
    padding: {
      type: "enum",
      values: ["sm", "lg"],
      default: "lg",
      title: "Padding",
    },
  },
} as const satisfies DesignComponentMeta;

describe("sandbox-engine registry", () => {
  const registry = createSandboxRegistry([
    {
      meta: sectionMeta,
      defaultChildren: "Section content",
      renderHtml: (ctx) =>
        `<section data-bg="${ctx.props.background}">${ctx.children ?? ""}</section>`,
    },
  ]);

  it("creates default draft from meta", () => {
    const draft = registry.createDefaultDraft("section");
    expect(draft?.props.background).toBe("transparent");
    expect(draft?.props.padding).toBe("lg");
    expect(draft?.children).toBe("Section content");
  });

  it("renders with draft + prop overrides", () => {
    const draft = registry.createDefaultDraft("section")!;
    const html = registry.renderWithDraft(
      "section",
      { ...draft, children: "Hello" },
      { background: "muted" },
    );
    expect(html).toContain('data-bg="muted"');
    expect(html).toContain("Hello");
  });

  it("builds permutation cards sharing draft children", () => {
    const draft = mergeDraft(registry.createDefaultDraft("section")!, {
      children: "Shared",
    });
    const cards = registry.buildPermutationCards("section", draft)!;
    expect(cards.length).toBe(4);
    expect(cards.every((c) => c.html.includes("Shared"))).toBe(true);
  });

  it("api payload for sandbox mode", () => {
    const draft = registry.createDefaultDraft("section")!;
    const payload = renderSandboxApiPayload(registry, "section", "sandbox", draft);
    expect(payload?.html).toContain("data-as-sandbox");
    expect(payload?.html).toContain("section");
  });
});
