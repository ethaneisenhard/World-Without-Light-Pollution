import { describe, expect, it } from "vitest";
import {
  formatShellRunResult,
  parseShellRunInput,
  truncateShellOutput,
} from "./shell-run-pure.js";

describe("parseShellRunInput", () => {
  it("accepts a command with defaults", () => {
    expect(parseShellRunInput({ command: "imsg chats --limit 5" })).toEqual({
      ok: true,
      command: "imsg chats --limit 5",
      cwd: "project",
      timeoutMs: 30_000,
    });
  });

  it("rejects empty command", () => {
    expect(parseShellRunInput({ command: "  " }).ok).toBe(false);
  });

  it("accepts home cwd and timeout", () => {
    expect(
      parseShellRunInput({
        command: "pwd",
        cwd: "home",
        timeoutMs: 5_000,
      }),
    ).toEqual({
      ok: true,
      command: "pwd",
      cwd: "home",
      timeoutMs: 5_000,
    });
  });
});

describe("truncateShellOutput / formatShellRunResult", () => {
  it("truncates long output", () => {
    const big = "a".repeat(10_000);
    expect(truncateShellOutput(big, 100).length).toBeLessThanOrEqual(120);
  });

  it("formats result", () => {
    const text = formatShellRunResult({
      command: "echo hi",
      cwd: "/tmp",
      code: 0,
      stdout: "hi\n",
      stderr: "",
    });
    expect(text).toContain("$ echo hi");
    expect(text).toContain("hi");
  });
});
