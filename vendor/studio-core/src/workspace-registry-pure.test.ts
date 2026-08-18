import { describe, expect, it } from "vitest";
import {
  isPathUnderPlanningHome,
  isWorkspaceProtectedId,
  parseWorkspaceDeleteInput,
  parseWorkspacePatchInput,
  registryWithoutProject,
  workspaceConfirmPhraseOk,
  ensureStudioSelfWorkspace,
} from "./workspace-registry-pure.js";

describe("workspace-registry-pure", () => {
  it("protects glassbox-studio", () => {
    expect(isWorkspaceProtectedId("glassbox-studio")).toBe(true);
    expect(isWorkspaceProtectedId("van-build")).toBe(false);
  });

  it("inserts glassbox-studio at repo root when missing", () => {
    const { next, inserted } = ensureStudioSelfWorkspace({
      version: 1,
      projects: [{ id: "demo-blog", path: "projects/demo-blog", name: "Demo Blog" }],
    });
    expect(inserted).toBe(true);
    expect(next.projects[0]).toEqual({
      id: "glassbox-studio",
      path: ".",
      name: "Glass Box Studio",
    });
    expect(next.projects.map((p) => p.id)).toEqual([
      "glassbox-studio",
      "demo-blog",
    ]);
    const again = ensureStudioSelfWorkspace(next);
    expect(again.inserted).toBe(false);
    expect(again.next).toBe(next);
  });

  it("confirmPhrase matches id", () => {
    expect(workspaceConfirmPhraseOk("van-build", "van-build")).toBe(true);
    expect(workspaceConfirmPhraseOk("van-build", "delete van-build")).toBe(
      true,
    );
    expect(workspaceConfirmPhraseOk("van-build", "nope")).toBe(false);
  });

  it("planning home path check", () => {
    const norm = (p: string) => p;
    expect(
      isPathUnderPlanningHome(
        "/home/.glassbox-studio/workspaces/van-build",
        "/home/.glassbox-studio",
        norm,
      ),
    ).toBe(true);
    expect(
      isPathUnderPlanningHome(
        "/Users/me/Glass Box Studio",
        "/home/.glassbox-studio",
        norm,
      ),
    ).toBe(false);
  });

  it("delete parse requires projectId", () => {
    expect(parseWorkspaceDeleteInput({}).ok).toBe(false);
    expect(
      parseWorkspaceDeleteInput({
        projectId: "van-build",
        deleteFiles: true,
        confirmPhrase: "van-build",
      }),
    ).toEqual({
      ok: true,
      value: {
        projectId: "van-build",
        deleteFiles: true,
        confirmPhrase: "van-build",
      },
    });
  });

  it("patch accepts placement-only (app storage toggle)", () => {
    expect(
      parseWorkspacePatchInput({
        projectId: "blog",
        placement: "local",
      }),
    ).toEqual({
      ok: true,
      value: {
        projectId: "blog",
        name: undefined,
        brief: undefined,
        placement: "local",
        prodUrl: undefined,
      },
    });
  });

  it("patch accepts prodUrl", () => {
    expect(
      parseWorkspacePatchInput({
        projectId: "blog",
        prodUrl: "https://demo.example",
      }),
    ).toEqual({
      ok: true,
      value: {
        projectId: "blog",
        name: undefined,
        brief: undefined,
        placement: undefined,
        prodUrl: "https://demo.example",
      },
    });
    expect(
      parseWorkspacePatchInput({
        projectId: "blog",
        prodUrl: null,
      }),
    ).toMatchObject({ ok: true, value: { prodUrl: null } });
  });

  it("registryWithoutProject", () => {
    const { next, removed } = registryWithoutProject(
      {
        version: 1,
        projects: [
          { id: "a", path: "/a" },
          { id: "b", path: "/b" },
        ],
      },
      "a",
    );
    expect(removed?.id).toBe("a");
    expect(next.projects.map((p) => p.id)).toEqual(["b"]);
  });
});
