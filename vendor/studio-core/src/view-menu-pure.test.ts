import { describe, expect, it } from "vitest";
import {
  countOpenViews,
  projectViewMenuRows,
  viewMenuItemIds,
  VIEW_MENU_GROUPS,
} from "./view-menu-pure.js";

describe("view-menu-pure", () => {
  it("lists every window id once across groups", () => {
    const ids = viewMenuItemIds();
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("code");
    expect(ids).toContain("analytics");
    expect(ids).not.toContain("messages");
    expect(ids).toContain("workflows");
    expect(ids).toContain("home");
    expect(ids).toContain("workspace");
  });

  it("projects checkmarks from open state with separators", () => {
    const rows = projectViewMenuRows({
      code: true,
      live: true,
      analytics: false,
    });
    expect(rows.some((r) => r.kind === "separator")).toBe(true);
    const code = rows.find((r) => r.kind === "item" && r.id === "code");
    expect(code).toEqual(
      expect.objectContaining({
        kind: "item",
        id: "code",
        checked: true,
      }),
    );
    const analytics = rows.find(
      (r) => r.kind === "item" && r.id === "analytics",
    );
    expect(analytics).toEqual(
      expect.objectContaining({ checked: false }),
    );
    expect(rows.filter((r) => r.kind === "separator")).toHaveLength(
      VIEW_MENU_GROUPS.length - 1,
    );
  });

  it("hides app-only rows for planning kind", () => {
    const rows = projectViewMenuRows(
      {
        code: true,
        home: true,
        notes: true,
        roadmap: true,
      },
      { kind: "planning" },
    );
    const itemIds = rows.filter((r) => r.kind === "item").map((r) => r.id);
    expect(itemIds).toContain("home");
    expect(itemIds).toContain("workspace");
    expect(itemIds).toContain("settings");
    expect(itemIds).toContain("chat");
    expect(itemIds).toContain("calendar");
    expect(itemIds).toContain("media");
    expect(itemIds).toContain("memory");
    expect(itemIds).toContain("roadmap");
    expect(itemIds).toContain("notes");
    expect(itemIds).not.toContain("code");
    expect(itemIds).not.toContain("live");
    expect(itemIds).not.toContain("design");
    expect(itemIds).not.toContain("runtimes");
    expect(itemIds).not.toContain("terminal");
    expect(itemIds).not.toContain("converter");
    expect(itemIds).not.toContain("data");
    expect(itemIds).not.toContain("forms");
    expect(itemIds).not.toContain("integrations");
    expect(itemIds).not.toContain("workflows");
    expect(itemIds).not.toContain("email");
    expect(itemIds).not.toContain("analytics");
    expect(rows.some((r) => r.kind === "item" && r.id === "code")).toBe(false);
    expect(rows.find((r) => r.kind === "item" && r.id === "notes")).toEqual(
      expect.objectContaining({ checked: true }),
    );
  });

  it("counts open views", () => {
    expect(countOpenViews({ code: true, live: true, chat: false })).toBe(2);
    expect(countOpenViews({})).toBe(0);
  });

  it("Global shell uses workspace globalShell face (Workspaces)", () => {
    const rows = projectViewMenuRows({ workspace: true }, { globalShell: true });
    const workspace = rows.find(
      (r) => r.kind === "item" && r.id === "workspace",
    );
    expect(workspace).toEqual(
      expect.objectContaining({
        kind: "item",
        id: "workspace",
        label: "Workspaces",
        hint: "All linked workspaces",
        checked: true,
      }),
    );
  });

  it("project shell keeps Workspace Home label", () => {
    const rows = projectViewMenuRows(
      { workspace: true },
      { kind: "app", globalShell: false },
    );
    const workspace = rows.find(
      (r) => r.kind === "item" && r.id === "workspace",
    );
    expect(workspace).toEqual(
      expect.objectContaining({
        label: "Workspace Home",
        hint: "Selected workspace overview",
      }),
    );
  });
});
