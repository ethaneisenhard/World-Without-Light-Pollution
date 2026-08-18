import { describe, expect, it } from "vitest";
import {
  DEFAULT_MOBILE_DOCK_TABS_GLOBAL,
  DEFAULT_MOBILE_DOCK_TABS_WORKSPACE,
  mobileDockGridColsClass,
  parseMobileDockTabs,
  resolveMobileDockTabs,
} from "./mobile-dock-pure.ts";

describe("parseMobileDockTabs", () => {
  it("accepts 3–5 known ids", () => {
    const ok = parseMobileDockTabs(["ai", "settings", "messages"]);
    expect(ok).toEqual({
      ok: true,
      tabs: ["ai", "settings", "messages"],
    });
  });

  it("rejects unknown / short / dupes", () => {
    expect(parseMobileDockTabs(["ai"]).ok).toBe(false);
    expect(parseMobileDockTabs(["ai", "bogus", "nav"]).ok).toBe(false);
    expect(parseMobileDockTabs(["ai", "ai", "nav"]).ok).toBe(false);
  });
});

describe("resolveMobileDockTabs", () => {
  it("global defaults exclude nav/files", () => {
    const tabs = resolveMobileDockTabs({ scope: "global" });
    expect(tabs.map((t) => t.id)).toEqual([...DEFAULT_MOBILE_DOCK_TABS_GLOBAL]);
    expect(tabs.every((t) => t.id !== "nav" && t.id !== "files")).toBe(true);
  });

  it("workspace defaults include nav/files", () => {
    const tabs = resolveMobileDockTabs({ scope: "workspace" });
    expect(tabs.map((t) => t.id)).toEqual([
      ...DEFAULT_MOBILE_DOCK_TABS_WORKSPACE,
    ]);
  });

  it("project override wins in workspace", () => {
    const tabs = resolveMobileDockTabs({
      scope: "workspace",
      globalTabs: ["settings", "calendar", "messages", "ai", "workspaces"],
      projectTabs: ["ai", "messages", "settings"],
    });
    expect(tabs.map((t) => t.id)).toEqual(["ai", "messages", "settings"]);
  });

  it("global config override", () => {
    const tabs = resolveMobileDockTabs({
      scope: "global",
      globalTabs: ["ai", "messages", "calendar"],
    });
    expect(tabs.map((t) => t.id)).toEqual(["ai", "messages", "calendar"]);
  });
});

describe("mobileDockGridColsClass", () => {
  it("maps count to grid-cols", () => {
    expect(mobileDockGridColsClass(3)).toBe("grid-cols-3");
    expect(mobileDockGridColsClass(4)).toBe("grid-cols-4");
    expect(mobileDockGridColsClass(5)).toBe("grid-cols-5");
  });
});
