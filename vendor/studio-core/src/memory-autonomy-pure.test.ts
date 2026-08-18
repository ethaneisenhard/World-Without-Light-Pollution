import { describe, expect, it } from "vitest";
import {
  memoryStatusAfterPropose,
  parseMemoryAutonomyDial,
  shouldAutoActivateMemory,
} from "./memory-autonomy-pure.js";
import { MEMORY_PREF_SCORE } from "./memory-retrieve-pure.js";

describe("memory-autonomy-pure", () => {
  it("defaults staged_only", () => {
    expect(parseMemoryAutonomyDial("nope")).toBe("staged_only");
  });

  it("auto_low_risk activates pref extracts", () => {
    expect(
      shouldAutoActivateMemory({
        dial: "auto_low_risk",
        row: {
          status: "staged",
          origin: "self_learn",
          why: "pref:theme",
          scope: "studio",
          score: MEMORY_PREF_SCORE,
        },
      }),
    ).toBe(true);
  });

  it("staged_only never auto-activates", () => {
    expect(
      memoryStatusAfterPropose({
        requested: "staged",
        dial: "staged_only",
        row: {
          origin: "hand_authored",
          why: "pref:x",
          scope: "studio",
          score: 1,
        },
      }),
    ).toBe("staged");
  });
});
