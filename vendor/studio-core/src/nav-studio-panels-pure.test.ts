import { describe, expect, it } from "vitest";
import {
  buildStudioPanelNavItems,
  isStudioPanelPath,
  mergeStudioNavWithPanels,
  orderNavFoldersThenLeaves,
  orderNavLeavesThenFolders,
  resolveStudioPanelNav,
  studioPanelPath,
} from "./nav-studio-panels-pure.js";

describe("nav-studio-panels-pure", () => {
  it("builds panel groups with leaf S-pages before folders", () => {
    const items = buildStudioPanelNavItems();
    expect(items.map((i) => i.label)).toEqual([
      "Workspace Home",
      "Integrations",
      "Workflows",
      "Calendar",
      "Media",
      "Messages",
      "Memory",
      "Roadmap",
      "Forms",
      "Settings",
      "Data",
      "Email",
      "Analytics",
    ]);
    const firstFolder = items.findIndex((i) => Boolean(i.children?.length));
    expect(firstFolder).toBeGreaterThan(0);
    expect(
      items.slice(0, firstFolder).every((i) => !i.children?.length),
    ).toBe(true);
    expect(
      items.slice(firstFolder).every((i) => Boolean(i.children?.length)),
    ).toBe(true);
    const settings = items.find((i) => i.label === "Settings");
    expect(settings?.children?.map((c) => c.label)).toEqual([
      "Profile",
      "General",
      "Startup",
      "AI",
      "MCP tools",
      "Integrations",
      "Skills",
      "Rules",
      "Providers",
    ]);
    const analytics = items.find((i) => i.label === "Analytics");
    expect(analytics?.children?.map((c) => c.label)).toEqual([
      "Overview",
      "Funnels",
      "Tracking plan",
      "Live events",
    ]);
  });

  it("resolves synthetic paths to window + section", () => {
    expect(
      resolveStudioPanelNav(studioPanelPath("analytics", "funnels")),
    ).toEqual({
      window: "analytics",
      section: "funnels",
    });
    expect(resolveStudioPanelNav(studioPanelPath("calendar"))).toEqual({
      window: "calendar",
    });
    expect(isStudioPanelPath("content/pages")).toBe(false);
  });

  it("merges studio leaves, then studio folders, then project folders", () => {
    const merged = mergeStudioNavWithPanels([
      {
        id: "website",
        label: "Website",
        path: "content",
        children: [{ id: "pages", label: "Pages", path: "content/pages" }],
      },
      { id: "orphan", label: "Orphan Page", path: "orphan.md" },
    ]);
    const labels = merged.map((i) => i.label);
    expect(labels.indexOf("Workspace Home")).toBe(0);
    expect(labels.indexOf("Workspace Home")).toBeLessThan(
      labels.indexOf("Settings"),
    );
    expect(labels.indexOf("Settings")).toBeLessThan(labels.indexOf("Website"));
    expect(labels.indexOf("Website")).toBeLessThan(
      labels.indexOf("Orphan Page"),
    );
  });

  it("orderNavFoldersThenLeaves is stable", () => {
    const ordered = orderNavFoldersThenLeaves([
      { id: "a", label: "A", path: "a" },
      {
        id: "b",
        label: "B",
        path: "b",
        children: [{ id: "b1", label: "B1", path: "b/1" }],
      },
      { id: "c", label: "C", path: "c" },
    ]);
    expect(ordered.map((i) => i.label)).toEqual(["B", "A", "C"]);
  });

  it("orderNavLeavesThenFolders puts S-pages first", () => {
    const ordered = orderNavLeavesThenFolders([
      {
        id: "b",
        label: "B",
        path: "b",
        children: [{ id: "b1", label: "B1", path: "b/1" }],
      },
      { id: "a", label: "A", path: "a" },
      { id: "c", label: "C", path: "c" },
    ]);
    expect(ordered.map((i) => i.label)).toEqual(["A", "C", "B"]);
  });
});
