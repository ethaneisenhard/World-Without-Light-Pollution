import { describe, expect, it } from "vitest";
import {
  collectNavPaths,
  expandNavFromFilePaths,
  filePathToNavLabel,
  isNavFilePath,
  isNavPathActive,
  projectNavToTree,
  resolveActiveNavPath,
} from "./nav-pure.js";

describe("projectNavToTree", () => {
  it("flattens nested project.json nav", () => {
    const tree = projectNavToTree({
      nav: {
        website: {
          path: "content",
          children: { blog: { path: "blog", kind: "mdx-posts" } },
        },
        app: { path: "app" },
      },
    });
    expect(tree).toHaveLength(2);
    expect(tree[0]?.children?.[0]?.path).toBe("content/blog");
    expect(tree[0]?.children?.[0]?.kind).toBe("mdx-posts");
  });
});

describe("resolveActiveNavPath / isNavPathActive", () => {
  const paths = ["content", "content/blog", "app"];

  it("picks deepest match — parent not active when child path selected", () => {
    expect(resolveActiveNavPath("content/blog", paths)).toBe("content/blog");
    expect(isNavPathActive("content/blog", "content", paths)).toBe(false);
    expect(isNavPathActive("content/blog", "content/blog", paths)).toBe(true);
  });

  it("activates ancestor when cwd is under a nav folder", () => {
    expect(resolveActiveNavPath("content/blog/posts/hello.mdx", paths)).toBe(
      "content/blog",
    );
    expect(isNavPathActive("content/blog/posts/hello.mdx", "content/blog", paths)).toBe(
      true,
    );
    expect(isNavPathActive("content/blog/posts/hello.mdx", "content", paths)).toBe(
      false,
    );
  });

  it("exact match for leaf cwd", () => {
    expect(isNavPathActive("content", "content", paths)).toBe(true);
    expect(isNavPathActive("content", "content/blog", paths)).toBe(false);
  });

  it("collectNavPaths walks children", () => {
    const tree = projectNavToTree({
      nav: {
        website: {
          path: "content",
          children: { blog: { path: "blog" } },
        },
      },
    });
    expect(collectNavPaths(tree)).toEqual(["content", "content/blog"]);
  });

  it("collectNavFilePaths drops folders — Pierre Trees file-only contract", async () => {
    const { collectNavFilePaths } = await import("./nav-pure.js");
    const tree = expandNavFromFilePaths(
      projectNavToTree({
        nav: {
          website: {
            path: "content",
            children: { pages: { path: "pages", kind: "pages" } },
          },
        },
      }),
      ["content/pages/home.md", "content/pages/about.md"],
    );
    expect(collectNavFilePaths(tree).sort()).toEqual([
      "content/pages/about.md",
      "content/pages/home.md",
    ]);
  });

  it("nested nav labels use leaf key — Pages not Website.pages", () => {
    const tree = projectNavToTree({
      nav: {
        website: {
          path: "content",
          children: { pages: { path: "pages", kind: "pages" } },
        },
      },
    });
    expect(tree[0]?.label).toBe("Website");
    expect(tree[0]?.children?.[0]?.label).toBe("Pages");
  });

  it("navTreeToPierreProjection uses studio labels not disk folders", async () => {
    const { navTreeToPierreProjection, pruneNavToPageViews } = await import(
      "./nav-pure.js"
    );
    const tree = pruneNavToPageViews(
      expandNavFromFilePaths(
        projectNavToTree({
          nav: {
            website: {
              path: "content",
              children: { pages: { path: "pages", kind: "pages" } },
            },
            design: { path: "src/styles", kind: "files" },
          },
        }),
        ["content/pages/home.md", "src/styles/site.css"],
      ),
    );
    const proj = navTreeToPierreProjection(tree);
    expect(proj.paths).toEqual(["Website/Pages/Home"]);
    expect(proj.toRealPath["Website/Pages/Home"]).toBe("content/pages/home.md");
    expect(proj.toVirtualPath["content"]).toBe("Website");
    expect(proj.toRealPath["Website"]).toBe("content");
  });

  it("navTreeToPierreProjection keeps Settings section order (not alpha)", async () => {
    const { navTreeToPierreProjection } = await import("./nav-pure.js");
    const { mergeStudioNavWithPanels } = await import(
      "./nav-studio-panels-pure.js"
    );
    const { SETTINGS_NAV_SECTIONS } = await import("./settings-nav-pure.js");
    const proj = navTreeToPierreProjection(mergeStudioNavWithPanels([]));
    const settingsLeaves = proj.paths.filter((p) =>
      p.startsWith("Settings/"),
    );
    expect(settingsLeaves).toEqual(
      SETTINGS_NAV_SECTIONS.map((s) => `Settings/${s.label}`),
    );
  });

  it("navTreeToPierreProjection keeps declaration order across sections (not Pierre alpha)", async () => {
    const { navTreeToPierreProjection, expandNavFromFilePaths } = await import(
      "./nav-pure.js"
    );
    const tree = expandNavFromFilePaths(
      projectNavToTree({
        nav: {
          website: {
            path: "content",
            children: { pages: { path: "pages", kind: "pages" } },
          },
          design: {
            path: "design",
            children: {
              components: { path: "components", kind: "components" },
            },
          },
        },
      }),
      [
        "content/pages/home.md",
        "packages/library/components/src/composites/blog-hero/component.ts",
      ],
    );
    const proj = navTreeToPierreProjection(tree);
    // Website before Design in project.json — Pierre default sort would reverse.
    expect(proj.paths[0]).toMatch(/^Website\//);
    expect(proj.paths.some((p) => p.includes("Blog Hero"))).toBe(true);
    const websiteIdx = proj.paths.findIndex((p) => p.startsWith("Website/"));
    const designIdx = proj.paths.findIndex((p) => p.startsWith("Design/"));
    expect(websiteIdx).toBeGreaterThanOrEqual(0);
    expect(designIdx).toBeGreaterThan(websiteIdx);
  });

  it("pruneNavToPageViews drops App code sections but keeps Design", async () => {
    const { pruneNavToPageViews } = await import("./nav-pure.js");
    const tree = expandNavFromFilePaths(
      projectNavToTree({
        nav: {
          website: {
            path: "content",
            children: { pages: { path: "pages", kind: "pages" } },
          },
          app: { path: "src", kind: "files" },
          design: {
            path: "design",
            children: {
              components: { path: "components", kind: "components" },
              design_system: {
                path: "design-system.json",
                kind: "design-system",
              },
            },
          },
        },
      }),
      [
        "content/pages/home.md",
        "src/index.ts",
        "design/components/primitives/section/component.ts",
        "design/design-system.json",
      ],
    );
    const pruned = pruneNavToPageViews(tree);
    expect(pruned.map((i) => i.id).sort()).toEqual(["design", "website"]);
    expect(pruned.find((i) => i.id === "design")?.children?.map((c) => c.kind)).toEqual(
      ["components", "design-system"],
    );
  });

  it("expandNavFromComponentPaths builds folder tree from component.ts", () => {
    const tree = expandNavFromFilePaths(
      projectNavToTree({
        nav: {
          design: {
            path: "design",
            children: {
              components: { path: "components", kind: "components" },
            },
          },
        },
      }),
      [
        "design/components/primitives/section/component.ts",
        "design/components/composites/blog-hero/component.ts",
      ],
    );
    const components = tree[0]?.children?.[0];
    expect(components?.kind).toBe("components");
    const labels = components?.children?.map((c) => c.label).sort();
    expect(labels).toEqual(["Composites", "Primitives"]);
    const section = components?.children
      ?.find((c) => c.label === "Primitives")
      ?.children?.[0];
    expect(section?.label).toBe("Section");
    expect(section?.kind).toBe("component");
    expect(section?.path).toBe(
      "design/components/primitives/section/component.ts",
    );
  });

  it("expandNavFromComponentPaths maps shared package manifests under Components", () => {
    const tree = expandNavFromFilePaths(
      projectNavToTree({
        nav: {
          design: {
            path: "design",
            children: {
              components: {
                path: "components",
                kind: "components",
                route: {
                  pattern: "/__as/design/components/:slug",
                  indexUrl: "/__as/design/components",
                },
              },
            },
          },
        },
      }),
      [
        "packages/library/components/src/primitives/section/component.ts",
        "packages/library/components/src/composites/blog-hero/component.ts",
        "packages/library/components/src/primitives/form/field/component.ts",
      ],
    );
    const components = tree[0]?.children?.[0];
    expect(components?.children?.map((c) => c.label).sort()).toEqual([
      "Composites",
      "Primitives",
    ]);
    const section = components?.children
      ?.find((c) => c.label === "Primitives")
      ?.children?.find((c) => c.label === "Section");
    expect(section?.path).toBe(
      "packages/library/components/src/primitives/section/component.ts",
    );
    expect(section?.kind).toBe("component");
    expect(section?.route?.pattern).toBe("/__as/design/components/:slug");
    const field = components?.children
      ?.find((c) => c.label === "Primitives")
      ?.children?.find((c) => c.label === "Form")
      ?.children?.[0];
    expect(field?.label).toBe("Field");
    expect(field?.path).toBe(
      "packages/library/components/src/primitives/form/field/component.ts",
    );
  });

  it("navConfigHasComponentsKind + toSharedComponentManifestPaths", async () => {
    const {
      navConfigHasComponentsKind,
      toSharedComponentManifestPaths,
      SHARED_COMPONENT_SRC_ROOT,
    } = await import("./nav-pure.js");
    expect(
      navConfigHasComponentsKind({
        design: {
          path: "design",
          children: { components: { path: "components", kind: "components" } },
        },
      }),
    ).toBe(true);
    expect(navConfigHasComponentsKind({ website: { path: "content" } })).toBe(
      false,
    );
    expect(
      toSharedComponentManifestPaths([
        "primitives/button/component.ts",
        "readme.md",
      ]),
    ).toEqual([
      `${SHARED_COMPONENT_SRC_ROOT}/primitives/button/component.ts`,
    ]);
  });

  it("extractPageNavTitle prefers frontmatter then heading", async () => {
    const { extractPageNavTitle } = await import("./nav-pure.js");
    expect(
      extractPageNavTitle(
        "---\ntitle: Hello World\n---\n\nBody",
        "content/blog/hello.mdx",
      ),
    ).toBe("Hello World");
    expect(
      extractPageNavTitle("# About\n\nFewer platforms.", "content/pages/about.md"),
    ).toBe("About");
    expect(extractPageNavTitle("no title here", "content/pages/home.md")).toBe(
      "Home",
    );
  });
});

describe("expandNavFromFilePaths", () => {
  it("lists page files under kind:pages", () => {
    const tree = projectNavToTree({
      nav: {
        website: {
          path: "content",
          children: { pages: { path: "pages", kind: "pages" } },
        },
      },
    });
    const expanded = expandNavFromFilePaths(tree, [
      "content/pages/about.md",
      "content/pages/home.md",
      "content/pages/contact.md",
      "src/index.ts",
    ]);
    const pages = expanded[0]?.children?.[0];
    expect(pages?.path).toBe("content/pages");
    expect(pages?.children?.map((c) => c.path)).toEqual([
      "content/pages/about.md",
      "content/pages/contact.md",
      "content/pages/home.md",
    ]);
    expect(pages?.children?.[0]?.label).toBe("About");
  });

  it("lists mdx posts under kind:mdx-posts", () => {
    const tree = projectNavToTree({
      nav: {
        website: {
          path: "content",
          children: { blog: { path: "blog", kind: "mdx-posts" } },
        },
      },
    });
    const expanded = expandNavFromFilePaths(tree, [
      "content/blog/hello-world.mdx",
      "content/blog/remix-on-cloudflare.mdx",
    ]);
    expect(expanded[0]?.children?.[0]?.children?.map((c) => c.label)).toEqual([
      "Hello World",
      "Remix On Cloudflare",
    ]);
  });
});

describe("filePathToNavLabel / isNavFilePath", () => {
  it("formats stems", () => {
    expect(filePathToNavLabel("content/pages/home.md")).toBe("Home");
    expect(filePathToNavLabel("content/blog/hello-world.mdx")).toBe("Hello World");
  });

  it("detects file paths", () => {
    expect(isNavFilePath("content/pages/home.md")).toBe(true);
    expect(isNavFilePath("content/pages")).toBe(false);
  });
});

describe("isNavFolderOpenByDefault", () => {
  it("opens ancestors of cwd", async () => {
    const { isNavFolderOpenByDefault } = await import("./nav-pure.js");
    expect(isNavFolderOpenByDefault("content", "content/pages/home.md")).toBe(true);
    expect(isNavFolderOpenByDefault("content/pages", "content/pages/home.md")).toBe(
      true,
    );
    expect(isNavFolderOpenByDefault("src", "content/pages/home.md")).toBe(false);
  });
});
