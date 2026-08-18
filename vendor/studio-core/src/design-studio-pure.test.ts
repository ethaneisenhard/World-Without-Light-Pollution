import { describe, expect, it } from "vitest";
import {
  designComponentIdFromPath,
  isDesignComponentModulePath,
} from "./component-contract-pure.js";
import {
  isDesignSitePath,
  isDesignStudioPath,
  resolveDesignCanvasSitePath,
  resolveDesignSelectionSitePath,
  resolveDesignHomeUrl,
  resolveLiveSitePreviewPath,
} from "./design-studio-pure.js";
import {
  expandNavFromFilePaths,
  projectNavToTree,
  pruneNavToPageViews,
} from "./nav-pure.js";

const designNav = {
  design: {
    path: "design",
    route: {
      pattern: "/__as/design",
      indexUrl: "/__as/design",
    },
    children: {
      components: {
        path: "components",
        kind: "components",
        route: {
          pattern: "/__as/design/components/:slug",
          indexUrl: "/__as/design/components",
        },
      },
      design_system: {
        path: "design-system.json",
        kind: "design-system",
        route: {
          pattern: "/__as/design/system",
          indexUrl: "/__as/design/system",
        },
      },
    },
  },
};

function designTree() {
  return pruneNavToPageViews(
    expandNavFromFilePaths(
      projectNavToTree({ nav: designNav }),
      [
        "design/components/composites/blog-hero/component.ts",
        "design/design-system.json",
      ],
    ),
  );
}

describe("component contract", () => {
  it("identifies component.ts modules", () => {
    expect(
      isDesignComponentModulePath(
        "design/components/composites/blog-hero/component.ts",
      ),
    ).toBe(true);
    expect(
      designComponentIdFromPath(
        "design/components/composites/blog-hero/component.ts",
      ),
    ).toBe("blog-hero");
  });
});

describe("isDesignStudioPath", () => {
  it("matches component modules + design-system", () => {
    expect(
      isDesignStudioPath("design/components/composites/blog-hero/component.ts"),
    ).toBe(true);
    expect(isDesignStudioPath("design/design-system.json")).toBe(true);
    expect(
      isDesignStudioPath(
        "packages/library/components/src/primitives/blockquote/component.ts",
      ),
    ).toBe(true);
  });

  it("rejects site content", () => {
    expect(isDesignStudioPath("content/pages/home.md")).toBe(false);
    expect(isDesignStudioPath("src/index.ts")).toBe(false);
  });
});

describe("isSharedComponentManifestPath", () => {
  it("matches packages/library/components manifests only", async () => {
    const { isSharedComponentManifestPath } = await import(
      "./design-studio-pure.js"
    );
    expect(
      isSharedComponentManifestPath(
        "packages/library/components/src/primitives/blockquote/component.ts",
      ),
    ).toBe(true);
    expect(
      isSharedComponentManifestPath(
        "design/components/primitives/button/component.ts",
      ),
    ).toBe(false);
  });
});

describe("resolveDesignHomeUrl", () => {
  it("reads design section indexUrl", () => {
    expect(resolveDesignHomeUrl(designTree())).toBe("/__as/design");
  });

  it("returns null when project has no design section", () => {
    const tree = projectNavToTree({
      nav: { website: { path: "content", kind: "pages" } },
    });
    expect(resolveDesignHomeUrl(tree)).toBeNull();
  });
});

describe("resolveDesignCanvasSitePath", () => {
  it("falls back to home with empty selection", () => {
    expect(resolveDesignCanvasSitePath("", designTree())).toBe("/__as/design");
  });

  it("maps design folder + leaves", () => {
    const tree = designTree();
    expect(resolveDesignCanvasSitePath("design", tree)).toBe("/__as/design");
    expect(resolveDesignCanvasSitePath("design/components", tree)).toBe(
      "/__as/design/components",
    );
    expect(
      resolveDesignCanvasSitePath("design/design-system.json", tree),
    ).toBe("/__as/design/system");
    expect(
      resolveDesignCanvasSitePath(
        "design/components/composites/blog-hero/component.ts",
        tree,
      ),
    ).toBe("/__as/design/components/blog-hero");
  });

  it("falls back to home for non-design selection", () => {
    expect(
      resolveDesignCanvasSitePath("content/pages/home.md", designTree()),
    ).toBe("/__as/design");
  });
});

describe("resolveDesignSelectionSitePath", () => {
  it("returns null outside Design nav", () => {
    expect(
      resolveDesignSelectionSitePath("content/pages/home.md", designTree()),
    ).toBeNull();
    expect(resolveDesignSelectionSitePath("", designTree())).toBeNull();
  });

  it("returns site path for design folders", () => {
    expect(resolveDesignSelectionSitePath("design", designTree())).toBe(
      "/__as/design",
    );
  });
});

describe("isDesignSitePath", () => {
  it("matches design canvas URLs", () => {
    expect(isDesignSitePath("/__as/design")).toBe(true);
    expect(isDesignSitePath("/__as/design/system")).toBe(true);
    expect(isDesignSitePath("/about")).toBe(false);
  });
});

describe("resolveLiveSitePreviewPath", () => {
  it("never returns design canvas URLs — uses fallback", () => {
    expect(
      resolveLiveSitePreviewPath(
        "design/components/composites/blog-hero/component.ts",
        designTree(),
        "/about",
      ),
    ).toBe("/about");
    expect(
      resolveLiveSitePreviewPath(
        "design/components/composites/blog-hero/component.ts",
        designTree(),
      ),
    ).toBe("/");
  });

  it("returns website routes from nav", () => {
    const tree = pruneNavToPageViews(
      expandNavFromFilePaths(
        projectNavToTree({
          nav: {
            website: {
              path: "content",
              children: {
                pages: {
                  path: "pages",
                  kind: "pages",
                  route: {
                    pattern: "/:slug",
                    index: "home",
                    indexUrl: "/",
                  },
                },
              },
            },
          },
        }),
        ["content/pages/home.md", "content/pages/about.md"],
      ),
    );
    expect(resolveLiveSitePreviewPath("content/pages/home.md", tree)).toBe("/");
    expect(resolveLiveSitePreviewPath("content/pages/about.md", tree)).toBe(
      "/about",
    );
  });
});
