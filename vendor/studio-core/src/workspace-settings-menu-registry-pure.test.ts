import { afterEach, describe, expect, it } from "vitest";
import {
  clearWorkspaceSettingsMenuOverrides,
  listWorkspaceSettingsMenuDefs,
  projectWorkspaceSettingsMenuRows,
  registerWorkspaceSettingsMenuItem,
  unregisterWorkspaceSettingsMenuItem,
  WORKSPACE_SETTINGS_MENU_REGISTRY,
} from "./workspace-settings-menu-registry-pure.ts";

describe("workspace-settings-menu-registry-pure", () => {
  afterEach(() => {
    clearWorkspaceSettingsMenuOverrides();
  });

  it("ships keep-tabs + appearance action", () => {
    const ids = WORKSPACE_SETTINGS_MENU_REGISTRY.map((d) => d.id);
    expect(ids).toContain("keep-tabs");
    expect(ids).toContain("open-appearance");
  });

  it("projects keep-tabs checked from keepTabsAcross", () => {
    const on = projectWorkspaceSettingsMenuRows({ keepTabsAcross: true });
    const toggle = on.find((r) => r.kind === "toggle" && r.id === "keep-tabs");
    expect(toggle).toMatchObject({
      kind: "toggle",
      checked: true,
      actionId: "toggle-keep-tabs",
    });

    const off = projectWorkspaceSettingsMenuRows({ keepTabsAcross: false });
    const toggleOff = off.find(
      (r) => r.kind === "toggle" && r.id === "keep-tabs",
    );
    expect(toggleOff).toMatchObject({ checked: false });
  });

  it("register adds extra rows for MCP/plugins", () => {
    registerWorkspaceSettingsMenuItem({
      kind: "action",
      id: "mcp-extra",
      order: 40,
      label: "MCP extra",
      actionId: "custom-mcp-action",
    });
    const ids = listWorkspaceSettingsMenuDefs().map((d) => d.id);
    expect(ids).toContain("mcp-extra");
    const rows = projectWorkspaceSettingsMenuRows({ keepTabsAcross: false });
    expect(rows.some((r) => r.kind === "action" && r.id === "mcp-extra")).toBe(
      true,
    );
    unregisterWorkspaceSettingsMenuItem("mcp-extra");
    expect(listWorkspaceSettingsMenuDefs().map((d) => d.id)).not.toContain(
      "mcp-extra",
    );
  });
});
