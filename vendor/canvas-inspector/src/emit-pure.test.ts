import { describe, expect, it } from "vitest";
import { AS_ATTR } from "./attr-contract-pure.js";
import {
  stampComponentAttrs,
  stampSlotAttrs,
  wrapInspectableHtml,
} from "./emit-pure.js";

describe("emit-pure", () => {
  it("stamps component attrs", () => {
    const s = stampComponentAttrs({
      componentId: "blog-hero",
      instanceId: "home-hero",
    });
    expect(s).toContain(`${AS_ATTR.component}="blog-hero"`);
    expect(s).toContain(`${AS_ATTR.instance}="home-hero"`);
    expect(s).toContain(`${AS_ATTR.kind}="component"`);
  });

  it("wraps html", () => {
    const html = wrapInspectableHtml({
      tag: "section",
      kind: "component",
      componentId: "section",
      children: "<p>x</p>",
    });
    expect(html.startsWith("<section ")).toBe(true);
    expect(html).toContain('data-as-component="section"');
    expect(html).toContain("<p>x</p></section>");
  });

  it("stamps slots", () => {
    expect(stampSlotAttrs({ componentId: "blog-hero", slot: "title" })).toContain(
      'data-as-slot="title"',
    );
  });
});
