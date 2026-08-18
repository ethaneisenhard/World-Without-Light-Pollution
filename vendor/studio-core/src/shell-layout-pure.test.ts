import { describe, expect, it } from "vitest";
import {
  DEFAULT_SHELL_LAYOUT,
  panelSideForRailRole,
  parseShellChatSide,
  parseStudioShellLayout,
  shellRailAtPhysicalSide,
} from "./shell-layout-pure.js";

describe("shell-layout-pure", () => {
  it("defaults chat on the left", () => {
    expect(DEFAULT_SHELL_LAYOUT.chatSide).toBe("left");
    expect(parseStudioShellLayout(undefined).chatSide).toBe("left");
    expect(parseShellChatSide("nope")).toBe("left");
  });

  it("parses chatSide right", () => {
    expect(parseStudioShellLayout({ chatSide: "right" }).chatSide).toBe(
      "right",
    );
    expect(parseShellChatSide("right")).toBe("right");
  });

  it("maps physical sides for chat left (default)", () => {
    expect(shellRailAtPhysicalSide("left", "left")).toBe("chat");
    expect(shellRailAtPhysicalSide("left", "right")).toBe("explorer");
  });

  it("maps physical sides when chat is on the right", () => {
    expect(shellRailAtPhysicalSide("right", "left")).toBe("explorer");
    expect(shellRailAtPhysicalSide("right", "right")).toBe("chat");
  });

  it("panelSideForRailRole keeps chat→left / explorer→right keys", () => {
    expect(panelSideForRailRole("chat")).toBe("left");
    expect(panelSideForRailRole("explorer")).toBe("right");
  });
});
