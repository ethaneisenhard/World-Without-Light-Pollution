import { describe, expect, it } from "vitest";
import {
  buildDesignBreadcrumbs,
  renderDesignBreadcrumbHtml,
} from "./breadcrumb-pure.js";

describe("buildDesignBreadcrumbs", () => {
  it("home is a single current crumb", () => {
    expect(buildDesignBreadcrumbs("home")).toEqual([{ label: "Design" }]);
  });

  it("components trail", () => {
    const crumbs = buildDesignBreadcrumbs("components");
    expect(crumbs).toHaveLength(2);
    expect(crumbs[0]?.href).toBe("/__as/design");
    expect(crumbs[1]?.label).toBe("Components");
    expect(crumbs[1]?.href).toBeUndefined();
  });

  it("system trail", () => {
    const crumbs = buildDesignBreadcrumbs("system");
    expect(crumbs[1]?.label).toBe("Design system");
  });

  it("component trail with leaf", () => {
    const crumbs = buildDesignBreadcrumbs("component", {
      label: "Section",
      navPath: "design/components/primitives/section/component.ts",
      sitePath: "/__as/design/components/section",
    });
    expect(crumbs.map((c) => c.label)).toEqual([
      "Design",
      "Components",
      "Section",
    ]);
    expect(crumbs[0]?.href).toBe("/__as/design");
    expect(crumbs[1]?.href).toBe("/__as/design/components");
    expect(crumbs[2]?.href).toBeUndefined();
    expect(crumbs[2]?.navPath).toContain("section");
  });
});

describe("renderDesignBreadcrumbHtml", () => {
  it("renders links + current", () => {
    const html = renderDesignBreadcrumbHtml(
      buildDesignBreadcrumbs("component", { label: "Section" }),
    );
    expect(html).toContain('aria-label="Design"');
    expect(html).toContain('data-as-design-nav="design"');
    expect(html).toContain("Components");
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("Section");
  });
});
