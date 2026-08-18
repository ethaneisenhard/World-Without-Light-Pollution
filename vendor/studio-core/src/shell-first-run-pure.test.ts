import { describe, expect, it } from "vitest";
import {
  nextShellFirstRunStep,
  shellFirstRunShouldShow,
} from "./shell-first-run-pure.js";

describe("shell-first-run-pure", () => {
  it("starts at welcome", () => {
    expect(nextShellFirstRunStep([])?.id).toBe("welcome");
    expect(shellFirstRunShouldShow({ completedIds: [], dismissed: false })).toBe(
      true,
    );
  });

  it("hides when dismissed or all done", () => {
    expect(
      shellFirstRunShouldShow({ completedIds: [], dismissed: true }),
    ).toBe(false);
    const all = [
      "welcome",
      "workspace",
      "messages",
      "calendar",
      "media",
      "automations",
    ];
    expect(nextShellFirstRunStep(all)).toBeNull();
    expect(
      shellFirstRunShouldShow({ completedIds: all, dismissed: false }),
    ).toBe(false);
  });
});
