import { describe, expect, it } from "vitest";
import {
  buildWorkspaceImportCandidates,
  canSelectAllWorkspaceImport,
  CLI_DEFAULT_WORKSPACE_IMPORT_SCAN_ROOT,
  DEFAULT_WORKSPACE_IMPORT_SCAN_ROOT,
  isFilesystemRootScan,
  joinWorkspaceScanPath,
  normalizeWorkspaceImportScanRoot,
  parentWorkspaceImportScanRoot,
  parseWorkspaceImportApplyInput,
  planWorkspaceImportLinks,
  relativeWorkspaceCandidatePath,
  shouldIncludeWorkspaceScanDirName,
  workspaceImportBreadcrumb,
  workspaceImportItemKind,
  workspaceImportJumpTargets,
  workspaceImportScanRootLabel,
} from "./workspace-import-candidates-pure.js";

describe("workspace-import-candidates-pure", () => {
  it("defaults scan root to disk root; CLI keeps Studio folder", () => {
    expect(DEFAULT_WORKSPACE_IMPORT_SCAN_ROOT).toBe("/");
    expect(CLI_DEFAULT_WORKSPACE_IMPORT_SCAN_ROOT).toBe(".");
    expect(normalizeWorkspaceImportScanRoot(undefined)).toBe("/");
    expect(normalizeWorkspaceImportScanRoot("/")).toBe("/");
    expect(normalizeWorkspaceImportScanRoot("./")).toBe(".");
    expect(normalizeWorkspaceImportScanRoot("projects/")).toBe("projects");
    expect(workspaceImportScanRootLabel(".")).toBe("Studio folder");
    expect(workspaceImportScanRootLabel("/")).toBe("this computer");
    expect(workspaceImportScanRootLabel("projects")).toBe("projects/");
  });

  it("joins and parents absolute scan roots", () => {
    expect(joinWorkspaceScanPath("/", "Users")).toBe("/Users");
    expect(joinWorkspaceScanPath("/Users", "sam")).toBe("/Users/sam");
    expect(parentWorkspaceImportScanRoot("/Users/sam")).toBe("/Users");
    expect(parentWorkspaceImportScanRoot("/Users")).toBe("/");
    expect(parentWorkspaceImportScanRoot("/")).toBe(null);
    expect(isFilesystemRootScan("/")).toBe(true);
    expect(canSelectAllWorkspaceImport("/")).toBe(false);
    expect(canSelectAllWorkspaceImport("/Users")).toBe(true);
  });

  it("builds disk-root breadcrumbs and jump targets", () => {
    expect(workspaceImportBreadcrumb("/")).toEqual([
      { label: "Disk root", scanRoot: "/" },
    ]);
    expect(workspaceImportBreadcrumb("/Users/sam")).toEqual([
      { label: "Disk root", scanRoot: "/" },
      { label: "Users", scanRoot: "/Users" },
      { label: "sam", scanRoot: "/Users/sam" },
    ]);
    expect(
      workspaceImportJumpTargets({
        fsRoot: "/",
        homeDir: "/Users/sam",
        studioRoot: "/Users/sam/studio",
      }).map((j) => j.id),
    ).toEqual(["home", "fs", "studio"]);
  });

  it("filters private / template / denylist dirs in repo mode", () => {
    expect(shouldIncludeWorkspaceScanDirName("demo-blog")).toBe(true);
    expect(shouldIncludeWorkspaceScanDirName("_template")).toBe(false);
    expect(shouldIncludeWorkspaceScanDirName(".hidden")).toBe(false);
    expect(shouldIncludeWorkspaceScanDirName("node_modules")).toBe(false);
    expect(shouldIncludeWorkspaceScanDirName(".hermes", "computer")).toBe(
      true,
    );
    expect(shouldIncludeWorkspaceScanDirName(".git", "computer")).toBe(false);
    expect(shouldIncludeWorkspaceScanDirName(".vol", "computer")).toBe(false);
  });

  it("builds root-relative paths", () => {
    expect(relativeWorkspaceCandidatePath(".", "demo-blog")).toBe("demo-blog");
    expect(relativeWorkspaceCandidatePath("projects", "demo-blog")).toBe(
      "projects/demo-blog",
    );
    const candidates = buildWorkspaceImportCandidates({
      scanRootRel: ".",
      dirs: [
        {
          dirName: "demo-blog",
          configId: "demo-blog",
          configName: "Demo Blog",
          hasProjectJson: true,
        },
        {
          dirName: "browserui-org",
          configName: "BrowserUI",
          hasProjectJson: true,
        },
      ],
      registry: {
        version: 1,
        projects: [
          {
            id: "demo-blog",
            path: "demo-blog",
            name: "Demo Blog",
          },
        ],
      },
    });
    expect(candidates).toHaveLength(2);
    const demo = candidates.find((c) => c.id === "demo-blog")!;
    expect(demo.registered).toBe(true);
    expect(demo.path).toBe("demo-blog");
    const bui = candidates.find((c) => c.id === "browserui-org")!;
    expect(bui.registered).toBe(false);
    expect(bui.name).toBe("BrowserUI");
  });

  it("builds absolute paths when browsing the computer", () => {
    const candidates = buildWorkspaceImportCandidates({
      scanRootRel: "/",
      dirs: [
        {
          dirName: "Users",
          absPath: "/Users",
          hasProjectJson: false,
        },
      ],
      registry: { version: 1, projects: [] },
    });
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.path).toBe("/Users");
    expect(candidates[0]?.id).toBe("users");
  });

  it("plans links from selection", () => {
    const candidates = buildWorkspaceImportCandidates({
      dirs: [
        { dirName: "a", hasProjectJson: false },
        { dirName: "b", hasProjectJson: false },
      ],
      registry: {
        version: 1,
        projects: [{ id: "a", path: "a", name: "a" }],
      },
    });
    const plan = planWorkspaceImportLinks({
      candidates,
      selectedIds: ["a", "b", "missing"],
    });
    expect(plan.toLink.map((c) => c.id)).toEqual(["b"]);
    expect(plan.alreadyRegistered).toEqual(["a"]);
    expect(plan.unknownIds).toEqual(["missing"]);
  });

  it("parses apply input", () => {
    expect(parseWorkspaceImportApplyInput({}).ok).toBe(false);
    const ok = parseWorkspaceImportApplyInput({
      selectedIds: ["demo-blog", " demo-blog "],
      scanRoot: ".",
    });
    expect(ok).toEqual({
      ok: true,
      value: { selectedIds: ["demo-blog"], scanRoot: "." },
    });
  });

  it("labels registered folders as Workspace kind", () => {
    expect(workspaceImportItemKind(true)).toBe("Workspace");
    expect(workspaceImportItemKind(false)).toBe("Folder");
  });
});
