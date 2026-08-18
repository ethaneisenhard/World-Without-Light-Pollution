import { describe, expect, it } from "vitest";
import type { WorkspaceImportCandidate } from "./workspace-import-candidates-pure.js";
import {
  canWorkspaceImportGoBack,
  filterWorkspaceImportFolders,
  isWorkspaceImportSidebarActive,
  workspaceImportFolderFace,
  workspaceImportHistoryAfterNavigate,
  workspaceImportHistoryGoBack,
  workspaceImportHistoryGoForward,
  workspaceImportSelectIds,
  workspaceImportSidebarRows,
} from "./workspace-import-finder-pure.js";

const folders: WorkspaceImportCandidate[] = [
  {
    id: "here",
    name: "here",
    path: "/Users/sam",
    dirName: "sam",
    registered: false,
    protected: false,
    hasProjectJson: false,
    isScanRoot: true,
  },
  {
    id: "blog",
    name: "Demo Blog",
    path: "/Users/sam/blog",
    dirName: "blog",
    registered: true,
    protected: false,
    hasProjectJson: true,
  },
  {
    id: "app",
    name: "App",
    path: "/Users/sam/app",
    dirName: "app",
    registered: false,
    protected: false,
    hasProjectJson: false,
  },
];

describe("workspace-import-finder-pure", () => {
  it("hides the current folder row and filters by query", () => {
    expect(filterWorkspaceImportFolders(folders, "").map((c) => c.id)).toEqual([
      "blog",
      "app",
    ]);
    expect(filterWorkspaceImportFolders(folders, "blog").map((c) => c.id)).toEqual(
      ["blog"],
    );
    expect(workspaceImportFolderFace(true)).toBe("workspace");
    expect(workspaceImportFolderFace(false)).toBe("folder");
  });

  it("records back/forward like a folder window", () => {
    const after = workspaceImportHistoryAfterNavigate({
      history: { back: [], forward: ["/tmp"] },
      current: "/",
      next: "/Users",
    });
    expect(after).toEqual({ back: ["/"], forward: [] });
    expect(canWorkspaceImportGoBack(after)).toBe(true);
    const back = workspaceImportHistoryGoBack({
      history: after,
      current: "/Users",
    });
    expect(back).toEqual({
      scanRoot: "/",
      history: { back: [], forward: ["/Users"] },
    });
    const fwd = workspaceImportHistoryGoForward({
      history: back!.history,
      current: "/",
    });
    expect(fwd?.scanRoot).toBe("/Users");
  });

  it("selects one folder, or toggles when additive", () => {
    expect(
      workspaceImportSelectIds({
        selectedIds: ["a"],
        id: "b",
        additive: false,
      }),
    ).toEqual(["b"]);
    expect(
      workspaceImportSelectIds({
        selectedIds: ["a"],
        id: "b",
        additive: true,
      }),
    ).toEqual(["a", "b"]);
    expect(
      workspaceImportSelectIds({
        selectedIds: ["a", "b"],
        id: "a",
        additive: true,
      }),
    ).toEqual(["b"]);
  });

  it("lists registered workspaces for the Finder sidebar", () => {
    expect(
      workspaceImportSidebarRows([
        { id: "demo-blog", name: "Demo Blog", path: "/Users/sam/demo-blog" },
        { id: "skip", name: "Root", path: "/" },
        { id: "zeta", name: "Zeta", path: "/Users/sam/zeta/" },
      ]).map((r) => r.id),
    ).toEqual(["demo-blog", "zeta"]);
    expect(
      isWorkspaceImportSidebarActive("/Users/sam/demo-blog/src", "/Users/sam/demo-blog"),
    ).toBe(true);
    expect(
      isWorkspaceImportSidebarActive("/Users/sam/other", "/Users/sam/demo-blog"),
    ).toBe(false);
  });
});
