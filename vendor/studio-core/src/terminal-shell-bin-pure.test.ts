import { describe, expect, it } from "vitest";
import { resolveTerminalShellBin } from "./terminal-shell-bin-pure.js";

describe("resolveTerminalShellBin", () => {
  it("prefers env SHELL when the file exists", () => {
    expect(
      resolveTerminalShellBin({
        envShell: "/custom/zsh",
        exists: (p) => p === "/custom/zsh",
      }),
    ).toBe("/custom/zsh");
  });

  it("skips missing env SHELL and finds bash (Fly/Debian slim)", () => {
    expect(
      resolveTerminalShellBin({
        envShell: "/bin/zsh",
        exists: (p) => p === "/bin/bash",
      }),
    ).toBe("/bin/bash");
  });

  it("falls through to sh when bash missing", () => {
    expect(
      resolveTerminalShellBin({
        envShell: "",
        exists: (p) => p === "/bin/sh",
      }),
    ).toBe("/bin/sh");
  });

  it("win32 uses COMSPEC / powershell", () => {
    expect(
      resolveTerminalShellBin({
        platform: "win32",
        envShell: "C:\\\\Windows\\\\System32\\\\cmd.exe",
        exists: () => false,
      }),
    ).toBe("C:\\\\Windows\\\\System32\\\\cmd.exe");
    expect(
      resolveTerminalShellBin({
        platform: "win32",
        envShell: null,
        exists: () => false,
      }),
    ).toBe("powershell.exe");
  });
});
