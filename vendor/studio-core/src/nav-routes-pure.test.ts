import { describe, expect, it } from "vitest";
import {
  expandNavFromFilePaths,
  projectNavToTree,
  pruneNavToPageViews,
} from "./nav-pure.js";
import {
  applyNavRoutePattern,
  findNavPathForSitePath,
  joinPreviewUrl,
  resolveNavFilePreviewPath,
} from "./nav-routes-pure.js";

describe("applyNavRoutePattern", () => {
  it("maps index stem to indexUrl", () => {
    expect(
      applyNavRoutePattern({ pattern: "/:slug", index: "home", indexUrl: "/" }, "home"),
    ).toBe("/");
  });

  it("fills :slug for other pages", () => {
    expect(
      applyNavRoutePattern({ pattern: "/:slug", index: "home" }, "about"),
    ).toBe("/about");
    expect(
      applyNavRoutePattern({ pattern: "/blog/:slug" }, "hello-world"),
    ).toBe("/blog/hello-world");
  });
});

describe("resolveNavFilePreviewPath", () => {
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
                route: { pattern: "/:slug", index: "home", indexUrl: "/" },
              },
              blog: {
                path: "blog",
                kind: "mdx-posts",
                route: { pattern: "/blog/:slug" },
              },
            },
          },
        },
      }),
      [
        "content/pages/home.md",
        "content/pages/about.md",
        "content/blog/hello-world.mdx",
      ],
    ),
  );

  it("resolves pages via project.json route map", () => {
    expect(resolveNavFilePreviewPath("content/pages/home.md", tree)).toBe("/");
    expect(resolveNavFilePreviewPath("content/pages/about.md", tree)).toBe(
      "/about",
    );
  });

  it("resolves mdx posts via route map", () => {
    expect(
      resolveNavFilePreviewPath("content/blog/hello-world.mdx", tree),
    ).toBe("/blog/hello-world");
  });

  it("returns null without a route map", () => {
    const bare = projectNavToTree({
      nav: { app: { path: "src", kind: "files" } },
    });
    expect(resolveNavFilePreviewPath("src/index.ts", bare)).toBeNull();
  });

  it("resolves design component + design-system routes", () => {
    const designTree = pruneNavToPageViews(
      expandNavFromFilePaths(
        projectNavToTree({
          nav: {
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
          },
        }),
        [
          "design/components/composites/blog-hero/component.ts",
          "design/design-system.json",
        ],
      ),
    );
    expect(
      resolveNavFilePreviewPath(
        "design/components/composites/blog-hero/component.ts",
        designTree,
      ),
    ).toBe("/__as/design/components/blog-hero");
    expect(
      resolveNavFilePreviewPath("design/design-system.json", designTree),
    ).toBe("/__as/design/system");
    expect(findNavPathForSitePath("/__as/design", designTree)).toBe("design");
    expect(findNavPathForSitePath("/__as/design/system", designTree)).toBe(
      "design/design-system.json",
    );
    expect(
      findNavPathForSitePath("/__as/design/components/blog-hero", designTree),
    ).toBe("design/components/composites/blog-hero/component.ts");
  });
});

describe("joinPreviewUrl", () => {
  it("joins base + site path", () => {
    expect(joinPreviewUrl("http://127.0.0.1:8789", "/")).toBe(
      "http://127.0.0.1:8789/",
    );
    expect(joinPreviewUrl("http://127.0.0.1:8789/", "/about")).toBe(
      "http://127.0.0.1:8789/about",
    );
  });
});
