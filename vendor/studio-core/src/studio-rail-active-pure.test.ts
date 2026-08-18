import { describe, expect, it } from "vitest";
import {
  isStudioHomeRailActive,
  isStudioRailWindowActive,
} from "./studio-rail-active-pure.js";

describe("studio-rail-active-pure", () => {
  it("Home active when focused — any workspace or Global", () => {
    expect(
      isStudioHomeRailActive({
        projectId: "demo-blog",
        focusedKind: "home",
      }),
    ).toBe(true);
    expect(isStudioHomeRailActive({ projectId: "", focusedKind: "home" })).toBe(
      true,
    );
  });

  it("Home active on Global with empty focus (landing); inactive when another kind focused", () => {
    expect(isStudioHomeRailActive({ projectId: null, focusedKind: "" })).toBe(
      true,
    );
    expect(
      isStudioHomeRailActive({
        projectId: "van-build",
        focusedKind: "data",
      }),
    ).toBe(false);
  });

  it("Messages follows focusedKind only", () => {
    expect(
      isStudioRailWindowActive({
        windowId: "messages",
        projectId: "demo-blog",
        focusedKind: "messages",
      }),
    ).toBe(true);
    expect(
      isStudioRailWindowActive({
        windowId: "messages",
        projectId: "",
        focusedKind: "home",
      }),
    ).toBe(false);
  });
});
