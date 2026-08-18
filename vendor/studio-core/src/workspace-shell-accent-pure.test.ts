import { describe, expect, it } from "vitest";
import {
  GLOBAL_STUDIO_SHELL_COLOR_NAME,
  globalStudioShellAccent,
  pickDefaultWorkspaceShellAccent,
  seededWorkspaceDesignDoc,
  WORKSPACE_SHELL_ACCENT_CYCLE,
  workspaceShellAccentIndex,
} from "./workspace-shell-accent-pure.js";

describe("workspace-shell-accent-pure", () => {
  it("Global uses green, distinct from cycle first slots", () => {
    expect(globalStudioShellAccent().name).toBe(GLOBAL_STUDIO_SHELL_COLOR_NAME);
    expect(globalStudioShellAccent().accent).toMatch(/^#/);
  });

  it("stable index from project id", () => {
    expect(workspaceShellAccentIndex("van-build")).toBe(
      workspaceShellAccentIndex("van-build"),
    );
    expect(workspaceShellAccentIndex("a")).not.toBe(
      workspaceShellAccentIndex("zzzz"),
    );
  });

  it("picks distinct accents when taken list blocks first choice", () => {
    const first = pickDefaultWorkspaceShellAccent({ projectId: "alpha" });
    const second = pickDefaultWorkspaceShellAccent({
      projectId: "alpha",
      takenAccentHexes: [first.accent],
    });
    expect(second.accent).not.toBe(first.accent);
    expect(WORKSPACE_SHELL_ACCENT_CYCLE).toContain(second.name);
  });

  it("seeded design has fillShell-style shell color maps", () => {
    const doc = seededWorkspaceDesignDoc(
      pickDefaultWorkspaceShellAccent({ projectId: "demo" }),
    );
    expect(doc.shell?.color?.fg?.accent).toMatch(/^#/);
    expect(doc.shell?.color?.bg).toBeTruthy();
  });
});
