import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS_HUB_NAV,
  DEFAULT_SETTINGS_SECTION,
  SETTINGS_HUB_NAV,
  SETTINGS_NAV_SECTIONS,
  coerceSettingsHubNav,
  coerceSettingsSection,
  isSettingsHubDirectoryId,
  parseSettingsHubNav,
  parseSettingsSection,
} from "./settings-nav-pure.js";

describe("settings-nav-pure", () => {
  it("lists profile, appearance, then general; Apps last", () => {
    expect(SETTINGS_NAV_SECTIONS.map((s) => s.id)).toEqual([
      "profile",
      "appearance",
      "layout",
      "general",
      "startup",
      "ai",
      "harnesses",
      "models",
      "security",
      "host",
      "mcp-tools",
      "integrations",
      "skills",
      "memory",
      "rules",
      "apps",
    ]);
    expect(SETTINGS_NAV_SECTIONS.find((s) => s.id === "apps")?.label).toBe(
      "Apps",
    );
    expect(
      SETTINGS_NAV_SECTIONS.find((s) => s.id === "appearance")?.label,
    ).toBe("Appearance");
    expect(
      SETTINGS_NAV_SECTIONS.some((s) => s.id === "workspace-appearance"),
    ).toBe(false);
  });

  it("hub nav bands: browse · you · agent · trust · library", () => {
    expect(
      SETTINGS_HUB_NAV.map((e) =>
        e.type === "separator" ? "---" : e.id,
      ),
    ).toEqual([
      "workspaces",
      "activity",
      "---",
      "profile",
      "appearance",
      "layout",
      "general",
      "startup",
      "---",
      "ai",
      "harnesses",
      "models",
      "---",
      "security",
      "host",
      "mcp-tools",
      "integrations",
      "---",
      "skills",
      "memory",
      "rules",
      "apps",
    ]);
  });

  it("empty / omitted ssect → null (mobile list)", () => {
    expect(parseSettingsSection(null)).toBeNull();
    expect(parseSettingsSection(undefined)).toBeNull();
    expect(parseSettingsSection("")).toBeNull();
    expect(parseSettingsSection("   ")).toBeNull();
    expect(parseSettingsHubNav(null)).toBeNull();
    expect(parseSettingsHubNav("")).toBeNull();
  });

  it("unknown form ssect → general; known ids parse", () => {
    expect(parseSettingsSection("nope")).toBe("general");
    expect(parseSettingsSection("startup")).toBe("startup");
    expect(parseSettingsSection("profile")).toBe("profile");
    expect(parseSettingsSection("appearance")).toBe("appearance");
    expect(parseSettingsSection("workspace-appearance")).toBe("appearance");
    expect(parseSettingsSection("security")).toBe("security");
    expect(parseSettingsSection("mcp-connectors")).toBe("integrations");
    expect(parseSettingsSection("integrations")).toBe("integrations");
    expect(parseSettingsSection("apps")).toBe("apps");
    expect(parseSettingsSection("providers")).toBe("apps");
    expect(parseSettingsSection("surfaces")).toBe("apps");
    expect(parseSettingsSection("folders")).toBe("apps");
  });

  it("hub directory ids are not form sections", () => {
    expect(parseSettingsSection("workspaces")).toBeNull();
    expect(parseSettingsSection("activity")).toBeNull();
    expect(parseSettingsSection("projects")).toBeNull();
  });

  it("parseSettingsHubNav accepts directory + form + legacy aliases", () => {
    expect(parseSettingsHubNav("workspaces")).toBe("workspaces");
    expect(parseSettingsHubNav("projects")).toBe("workspaces");
    expect(parseSettingsHubNav("surfaces")).toBe("apps");
    expect(parseSettingsHubNav("folders")).toBe("apps");
    expect(parseSettingsHubNav("apps")).toBe("apps");
    expect(parseSettingsHubNav("providers")).toBe("apps");
    expect(parseSettingsHubNav("ai")).toBe("ai");
    expect(parseSettingsHubNav("workspace-appearance")).toBe("appearance");
    expect(parseSettingsHubNav("nope")).toBe(DEFAULT_SETTINGS_HUB_NAV);
  });

  it("coerceSettingsSection fills desktop form default", () => {
    expect(coerceSettingsSection(null)).toBe(DEFAULT_SETTINGS_SECTION);
    expect(coerceSettingsSection("ai")).toBe("ai");
  });

  it("coerceSettingsHubNav fills desktop hub default (workspaces)", () => {
    expect(coerceSettingsHubNav(null)).toBe(DEFAULT_SETTINGS_HUB_NAV);
    expect(coerceSettingsHubNav("ai")).toBe("ai");
    expect(isSettingsHubDirectoryId("workspaces")).toBe(true);
    expect(isSettingsHubDirectoryId("activity")).toBe(true);
    expect(isSettingsHubDirectoryId("surfaces")).toBe(false);
    expect(isSettingsHubDirectoryId("apps")).toBe(false);
    expect(isSettingsHubDirectoryId("general")).toBe(false);
  });
});
