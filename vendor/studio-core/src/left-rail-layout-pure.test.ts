import { describe, expect, it } from "vitest";
import {
  DEFAULT_LEFT_RAIL_LAYOUT,
  LEFT_RAIL_ZONE_LABELS,
  WORKSPACE_SLOT_LABELS,
  activateWorkspaceSlot,
  accordionExpandWorkspace,
  mergeLeftRailLayout,
  parseLeftRailTabWire,
  projectWorkspaceRowClick,
  tabToWorkspaceSlot,
  toggleWorkspaceAccordion,
  workspaceSlotToTab,
  workspaceTabBodyVisible,
} from "./left-rail-layout-pure.js";

describe("left-rail-layout-pure", () => {
  it("default layout: studio → chats → workspaces → global-chat; Nav/Files", () => {
    expect(DEFAULT_LEFT_RAIL_LAYOUT.zones).toEqual([
      "studio",
      "chats",
      "workspaces",
      "global-chat",
    ]);
    expect(DEFAULT_LEFT_RAIL_LAYOUT.workspaceSlots).toEqual(["nav", "files"]);
    expect(WORKSPACE_SLOT_LABELS.nav).toBe("Nav");
    expect(WORKSPACE_SLOT_LABELS.files).toBe("Files");
    expect(LEFT_RAIL_ZONE_LABELS.chats).toBe("Chats");
    expect(LEFT_RAIL_ZONE_LABELS["global-chat"]).toBe("Global Chat");
  });

  it("maps Chat slot ↔ ai wire (compat)", () => {
    expect(workspaceSlotToTab("chat")).toBe("ai");
    expect(workspaceSlotToTab("nav")).toBe("nav");
    expect(tabToWorkspaceSlot("ai")).toBe("chat");
    expect(parseLeftRailTabWire("ai")).toBe("ai");
    expect(parseLeftRailTabWire(null)).toBe("nav");
  });

  it("mergeLeftRailLayout reorders zones and ignores unknown ids", () => {
    const merged = mergeLeftRailLayout(DEFAULT_LEFT_RAIL_LAYOUT, {
      zones: ["global-chat", "chats", "studio", "bogus", "workspaces", "studio"],
      workspaceSlots: ["chat", "nav", "files", "nope"],
    });
    expect(merged.zones).toEqual([
      "global-chat",
      "chats",
      "studio",
      "workspaces",
    ]);
    expect(merged.workspaceSlots).toEqual(["chat", "nav", "files"]);
  });

  it("merge falls back to base when contrib lists empty after normalize", () => {
    const merged = mergeLeftRailLayout(DEFAULT_LEFT_RAIL_LAYOUT, {
      zones: ["nope"],
      workspaceSlots: [],
    });
    expect(merged.zones).toEqual([...DEFAULT_LEFT_RAIL_LAYOUT.zones]);
    expect(merged.workspaceSlots).toEqual([
      ...DEFAULT_LEFT_RAIL_LAYOUT.workspaceSlots,
    ]);
  });

  it("workspace row click → accordion expand + project + nav", () => {
    const patch = projectWorkspaceRowClick({
      projectId: "demo-blog",
      allProjectIds: ["demo-blog", "starter"],
    });
    expect(patch.projectId).toBe("demo-blog");
    expect(patch.tab).toBe("nav");
    expect(patch.workspaceExpanded).toEqual({
      "demo-blog": true,
      starter: false,
    });
  });

  it("activateWorkspaceSlot sets tab wire for Chat", () => {
    const patch = activateWorkspaceSlot({
      projectId: "starter",
      slot: "chat",
      allProjectIds: ["demo-blog", "starter"],
    });
    expect(patch.tab).toBe("ai");
    expect(patch.workspaceExpanded.starter).toBe(true);
    expect(patch.workspaceExpanded["demo-blog"]).toBe(false);
  });

  it("accordionExpandWorkspace only one open", () => {
    expect(
      accordionExpandWorkspace(["a", "b", "c"], "b"),
    ).toEqual({ a: false, b: true, c: false });
  });

  it("toggleWorkspaceAccordion expands/collapses under accordion policy", () => {
    const expanded = toggleWorkspaceAccordion({
      projectId: "a",
      currentlyExpanded: false,
      allProjectIds: ["a", "b"],
      previousMap: { b: true },
    });
    expect(expanded).toEqual({ a: true, b: false });

    const collapsed = toggleWorkspaceAccordion({
      projectId: "a",
      currentlyExpanded: true,
      allProjectIds: ["a", "b"],
      previousMap: { a: true, b: false },
    });
    expect(collapsed.a).toBe(false);
  });

  it("workspaceTabBodyVisible only for expanded active project + matching slot", () => {
    expect(
      workspaceTabBodyVisible({
        workspaceId: "p1",
        activeProjectId: "p1",
        expanded: true,
        activeTab: "files",
        slot: "files",
      }),
    ).toBe(true);
    expect(
      workspaceTabBodyVisible({
        workspaceId: "p1",
        activeProjectId: "p1",
        expanded: true,
        activeTab: "ai",
        slot: "chat",
      }),
    ).toBe(true);
    expect(
      workspaceTabBodyVisible({
        workspaceId: "p1",
        activeProjectId: "p2",
        expanded: true,
        activeTab: "nav",
        slot: "nav",
      }),
    ).toBe(false);
  });
});
