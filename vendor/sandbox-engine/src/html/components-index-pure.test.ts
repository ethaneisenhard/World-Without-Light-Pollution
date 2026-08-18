import { describe, expect, it } from "vitest";
import {
  catalogLayers,
  componentsCatalogBlurb,
  layerLabel,
  renderComponentsCatalogBody,
  toComponentsIndexItems,
} from "./components-index-pure.js";
import type { DesignComponentMeta } from "@glassbox-studio/studio-core/browser";

const metas: DesignComponentMeta[] = [
  {
    id: "button",
    title: "Button",
    layer: "primitive",
    props: {},
  },
  {
    id: "blog-hero",
    title: "Blog hero",
    layer: "composite",
    props: {},
  },
];

describe("components-index-pure", () => {
  it("orders layers primitives then composites", () => {
    expect(catalogLayers(metas)).toEqual(["primitive", "composite"]);
    expect(layerLabel("primitive")).toBe("Primitive");
  });

  it("builds index items with sandbox hrefs", () => {
    const items = toComponentsIndexItems(metas, {
      basePath: "/__as/design/components",
      componentNavPath: (id) => `design/components/${id}/component.ts`,
    });
    expect(items[0]?.href).toContain("/button?mode=sandbox");
    expect(items[0]?.navPath).toContain("button");
    expect(componentsCatalogBlurb(metas[0]!)).toMatch(/Primitive/);
  });

  it("renders directory catalog chrome", () => {
    const items = toComponentsIndexItems(metas, {
      basePath: "/__as/design/components",
    });
    const html = renderComponentsCatalogBody({
      breadcrumbHtml: "<nav>crumbs</nav>",
      items,
    });
    expect(html).toContain('data-as-sb-catalog');
    expect(html).toContain("as-sb-catalog__card");
    expect(html).toContain("Open sandbox");
    expect(html).toContain('data-as-sb-catalog-layer="primitive"');
    expect(html).toContain("blog-hero");
    expect(html).toContain("data-as-design-site=");
  });
});
