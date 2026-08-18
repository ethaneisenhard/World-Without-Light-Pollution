import { describe, expect, it } from "vitest";
import type { NavTreeItem } from "./nav-pure.js";
import {
  applyNavProjection,
  builtinWorkspaceRailProfileMap,
  coerceWorkspaceTabForExperience,
  filterStudioPanelNavItems,
  patchWorkspaceRailOverlay,
  resolveWorkspaceRailExperience,
} from "./workspace-rail-experience-pure.js";

const baseTree: NavTreeItem[] = [
  {
    id: "website",
    label: "Website",
    path: "content/pages",
    kind: "pages",
    children: [
      { id: "website.home", label: "Home", path: "content/pages/home.md", kind: "file" },
    ],
  },
  {
    id: "pages",
    label: "Pages",
    path: "content/more",
    kind: "pages",
  },
  {
    id: "__studio__/media",
    label: "Media",
    path: "__studio__/media",
  },
];

describe("resolveWorkspaceRailExperience", () => {
  it("defaults to builder with nav+files", () => {
    const exp = resolveWorkspaceRailExperience({ projectId: "demo" });
    expect(exp.sources.profileId).toBe("builder");
    expect(exp.workspaceSlots).toEqual(["nav", "files"]);
  });

  it("nav-only hides files slot", () => {
    const exp = resolveWorkspaceRailExperience({
      projectId: "demo",
      userOverlay: { profileId: "nav-only" },
      userId: "local",
    });
    expect(exp.workspaceSlots).toEqual(["nav"]);
    expect(exp.studioPanels?.exclude).toContain("*");
    expect(exp.sources.userId).toBe("local");
  });

  it("user overlay slots win over profile", () => {
    const exp = resolveWorkspaceRailExperience({
      projectId: "demo",
      userOverlay: {
        profileId: "builder",
        workspaceSlots: ["nav"],
      },
    });
    expect(exp.workspaceSlots).toEqual(["nav"]);
  });

  it("lists builtin profiles", () => {
    const map = builtinWorkspaceRailProfileMap();
    expect(map["nav-only"]?.workspaceSlots).toEqual(["nav"]);
    expect(map.legal?.nav?.include).toContain("legal");
  });
});

describe("applyNavProjection", () => {
  it("renames and reorders with virtual group", () => {
    const next = applyNavProjection(baseTree, {
      include: ["website", "pages"],
      projection: [
        {
          id: "resources",
          label: "Resources",
          virtual: true,
          children: ["pages", "website"],
        },
        { id: "website", label: "Our site" },
        { id: "pages", label: "Pages" },
      ],
    });
    expect(next).toHaveLength(1);
    expect(next[0]?.id).toBe("resources");
    expect(next[0]?.label).toBe("Resources");
    expect(next[0]?.kind).toBe("group");
    expect(next[0]?.children?.map((c) => c.id)).toEqual(["pages", "website"]);
    expect(next[0]?.children?.[1]?.label).toBe("Our site");
  });

  it("include filter drops sections", () => {
    const next = applyNavProjection(baseTree, { include: ["website"] });
    expect(next.map((n) => n.id)).toEqual(["website"]);
  });
});

describe("filterStudioPanelNavItems", () => {
  it("drops __studio__ when exclude *", () => {
    const next = filterStudioPanelNavItems(baseTree, { exclude: ["*"] });
    expect(next.every((n) => !n.id.startsWith("__studio__"))).toBe(true);
  });
});

describe("coerceWorkspaceTabForExperience", () => {
  it("files → nav when files slot missing", () => {
    expect(coerceWorkspaceTabForExperience("files", ["nav"])).toBe("nav");
    expect(coerceWorkspaceTabForExperience("files", ["nav", "files"])).toBe(
      "files",
    );
  });
});

describe("patchWorkspaceRailOverlay", () => {
  it("merges projection patches", () => {
    const a = patchWorkspaceRailOverlay(null, {
      profileId: "nav-only",
      nav: { projection: [{ id: "website", label: "Site" }] },
    });
    const b = patchWorkspaceRailOverlay(a, {
      workspaceSlots: ["nav"],
      nav: { include: ["website"] },
    });
    expect(b.profileId).toBe("nav-only");
    expect(b.workspaceSlots).toEqual(["nav"]);
    expect(b.nav?.include).toEqual(["website"]);
    expect(b.nav?.projection?.[0]?.label).toBe("Site");
  });

  it("profileId clear drops prior workspaceSlots override", () => {
    const a = patchWorkspaceRailOverlay(
      { profileId: "builder", workspaceSlots: ["nav", "files"] },
      { profileId: "nav-only" },
    );
    expect(a.profileId).toBe("nav-only");
    expect(a.workspaceSlots).toBeUndefined();
  });
});
