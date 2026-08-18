import { describe, expect, it } from "vitest";
import {
  DEFAULT_GLOBAL_FILE_ACCESS,
  globalFileAccessEnablesDiskTools,
  isGlobalStudioMonorepoAllowed,
  isGlobalWorkspaceFileAllowed,
  mergeGlobalFileAccessPatch,
  parseGlobalFileAccess,
  parseGlobalFilePath,
} from "./global-file-access-pure.js";

describe("global-file-access-pure", () => {
  it("defaults studio + all workspaces", () => {
    expect(parseGlobalFileAccess(undefined)).toEqual(DEFAULT_GLOBAL_FILE_ACCESS);
    expect(isGlobalStudioMonorepoAllowed(DEFAULT_GLOBAL_FILE_ACCESS)).toBe(true);
    expect(isGlobalWorkspaceFileAllowed(DEFAULT_GLOBAL_FILE_ACCESS, "demo-blog")).toBe(
      true,
    );
    expect(globalFileAccessEnablesDiskTools(DEFAULT_GLOBAL_FILE_ACCESS)).toBe(true);
  });

  it("parses workspaces none / list", () => {
    const none = parseGlobalFileAccess({ studioMonorepo: true, workspaces: "none" });
    expect(isGlobalWorkspaceFileAllowed(none, "x")).toBe(false);
    expect(globalFileAccessEnablesDiskTools(none)).toBe(true);

    const list = parseGlobalFileAccess({
      studioMonorepo: false,
      workspaces: [" a ", "b"],
    });
    expect(list.workspaces).toEqual(["a", "b"]);
    expect(isGlobalWorkspaceFileAllowed(list, "a")).toBe(true);
    expect(isGlobalWorkspaceFileAllowed(list, "c")).toBe(false);
    expect(globalFileAccessEnablesDiskTools(list)).toBe(true);

    const off = parseGlobalFileAccess({
      studioMonorepo: false,
      workspaces: "none",
    });
    expect(globalFileAccessEnablesDiskTools(off)).toBe(false);
  });

  it("parseGlobalFilePath", () => {
    expect(parseGlobalFilePath("@studio/apps/studio/client/x.ts")).toEqual({
      kind: "studio",
      rel: "apps/studio/client/x.ts",
    });
    expect(parseGlobalFilePath("@studio")).toEqual({
      kind: "studio",
      rel: "",
    });
    expect(parseGlobalFilePath("@studio/")).toEqual({
      kind: "studio",
      rel: "",
    });
    expect(parseGlobalFilePath("@ws/demo-blog/src/index.ts")).toEqual({
      kind: "workspace",
      projectId: "demo-blog",
      rel: "src/index.ts",
    });
    expect(parseGlobalFilePath("@ws/demo-blog")).toEqual({
      kind: "workspace",
      projectId: "demo-blog",
      rel: "",
    });
    expect(parseGlobalFilePath("@ws")).toEqual({
      kind: "workspace",
      projectId: "",
      rel: "",
    });
    expect(parseGlobalFilePath("content/home.md")).toEqual({
      kind: "scoped",
      path: "content/home.md",
    });
  });

  it("mergeGlobalFileAccessPatch", () => {
    const next = mergeGlobalFileAccessPatch(DEFAULT_GLOBAL_FILE_ACCESS, {
      workspaces: ["only"],
    });
    expect(next.studioMonorepo).toBe(true);
    expect(next.workspaces).toEqual(["only"]);
  });
});
