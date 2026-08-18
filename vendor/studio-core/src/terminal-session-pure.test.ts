/**
 * Terminal session caps / ids — pure tests.
 */

import { describe, expect, it } from "vitest";
import {
  checkTerminalSessionCap,
  createTerminalSessionId,
  DEFAULT_TERMINAL_SESSION_CAP,
  isPathUnderRoot,
  parseTerminalShellRootValue,
  resolveTerminalShellCwd,
  runtimeSessionLabel,
  shellSessionLabel,
  shellSessionLabelForRoot,
  terminalShellRootOptions,
  terminalShellRootValue,
} from "./terminal-session-pure.js";

describe("checkTerminalSessionCap", () => {
  it("allows under cap", () => {
    expect(checkTerminalSessionCap(0)).toEqual({ ok: true });
    expect(checkTerminalSessionCap(5)).toEqual({ ok: true });
  });

  it("refuses at cap", () => {
    expect(checkTerminalSessionCap(DEFAULT_TERMINAL_SESSION_CAP)).toEqual({
      ok: false,
      limit: DEFAULT_TERMINAL_SESSION_CAP,
      current: DEFAULT_TERMINAL_SESSION_CAP,
    });
  });
});

describe("createTerminalSessionId", () => {
  it("prefixes kind", () => {
    expect(createTerminalSessionId("shell", () => 1, () => "abc")).toBe(
      "shell-1-abc",
    );
    expect(createTerminalSessionId("runtime", () => 2, () => "xyz")).toBe(
      "runtime-2-xyz",
    );
  });
});

describe("isPathUnderRoot", () => {
  it("allows root and children", () => {
    expect(isPathUnderRoot("/proj", "/proj")).toBe(true);
    expect(isPathUnderRoot("/proj", "/proj/src")).toBe(true);
  });

  it("rejects escape", () => {
    expect(isPathUnderRoot("/proj", "/proj-other")).toBe(false);
    expect(isPathUnderRoot("/proj", "/etc")).toBe(false);
  });
});

describe("labels", () => {
  it("shell label", () => {
    expect(shellSessionLabel("demo-blog")).toBe("shell · demo-blog");
    expect(shellSessionLabel("")).toBe("shell · studio");
  });

  it("runtime label", () => {
    expect(runtimeSessionLabel("demo-blog", "web-node")).toBe(
      "runtime · demo-blog/web-node",
    );
  });

  it("shell label for root", () => {
    expect(shellSessionLabelForRoot({ kind: "vps" })).toBe("shell · VPS /");
    expect(shellSessionLabelForRoot({ kind: "studio" })).toBe("shell · studio");
    expect(
      shellSessionLabelForRoot({ kind: "project", projectId: "demo-blog" }),
    ).toBe("shell · demo-blog");
  });
});

describe("terminal shell roots", () => {
  it("round-trips select values", () => {
    expect(terminalShellRootValue({ kind: "vps" })).toBe("vps");
    expect(terminalShellRootValue({ kind: "studio" })).toBe("studio");
    expect(
      terminalShellRootValue({ kind: "project", projectId: "demo-blog" }),
    ).toBe("project:demo-blog");
    expect(parseTerminalShellRootValue("vps")).toEqual({ kind: "vps" });
    expect(parseTerminalShellRootValue("project:demo-blog")).toEqual({
      kind: "project",
      projectId: "demo-blog",
    });
    expect(parseTerminalShellRootValue("")).toBeNull();
  });

  it("resolves cwd per root kind", () => {
    expect(
      resolveTerminalShellCwd({
        root: { kind: "vps" },
        repoRoot: "/repo",
        projectRoot: null,
        hostRoot: "/",
      }),
    ).toEqual({ ok: true, cwd: "/" });
    expect(
      resolveTerminalShellCwd({
        root: { kind: "studio" },
        repoRoot: "/repo",
        projectRoot: null,
        hostRoot: "/",
      }),
    ).toEqual({ ok: true, cwd: "/repo" });
    expect(
      resolveTerminalShellCwd({
        root: { kind: "project", projectId: "demo" },
        repoRoot: "/repo",
        projectRoot: "/repo/projects/demo",
        hostRoot: "/",
      }),
    ).toEqual({ ok: true, cwd: "/repo/projects/demo" });
    expect(
      resolveTerminalShellCwd({
        root: { kind: "project", projectId: "missing" },
        repoRoot: "/repo",
        projectRoot: null,
        hostRoot: "/",
      }).ok,
    ).toBe(false);
  });

  it("builds dropdown options with VPS + Studio first", () => {
    expect(
      terminalShellRootOptions([
        { id: "demo-blog", name: "Demo Blog" },
        { id: " " },
      ]),
    ).toEqual([
      { value: "vps", label: "VPS / (entire host)" },
      { value: "studio", label: "Studio (monorepo)" },
      { value: "project:demo-blog", label: "Demo Blog (demo-blog)" },
    ]);
  });
});
