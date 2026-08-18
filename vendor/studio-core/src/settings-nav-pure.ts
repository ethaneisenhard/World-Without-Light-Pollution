/**
 * Settings DeskPane hub nav — URL `ssect=` drives active row.
 * Empty / omitted `ssect` → null (mobile list face).
 * Desktop coerces hub nav to Workspaces (directory) by default.
 *
 * Apps = plugin slots (calendar / media / email / analytics).
 * Legacy Providers / Surfaces / folders deep-links → Apps.
 * Legacy `workspace-appearance` → Appearance (unified).
 */

export type SettingsNavSection =
  | "profile"
  | "appearance"
  | "layout"
  | "general"
  | "startup"
  | "ai"
  | "harnesses"
  | "models"
  | "security"
  | "host"
  | "mcp-tools"
  | "integrations"
  | "rules"
  | "apps"
  | "skills"
  | "memory";

/** Directory filters hosted in the Settings hub (ex–Home browse). */
export type SettingsHubDirectoryId = "workspaces" | "activity";

export type SettingsHubNavId = SettingsHubDirectoryId | SettingsNavSection;

export type SettingsHubNavEntry =
  | { type: "item"; id: SettingsHubNavId; label: string }
  | { type: "separator"; id: string };

export const SETTINGS_NAV_SECTIONS: ReadonlyArray<{
  id: SettingsNavSection;
  label: string;
}> = [
  { id: "profile", label: "Profile" },
  { id: "appearance", label: "Appearance" },
  { id: "layout", label: "Layout" },
  { id: "general", label: "General" },
  { id: "startup", label: "Startup" },
  { id: "ai", label: "AI" },
  { id: "harnesses", label: "Harnesses" },
  { id: "models", label: "Models" },
  { id: "security", label: "Security" },
  { id: "host", label: "Cloud" },
  { id: "mcp-tools", label: "MCP tools" },
  { id: "integrations", label: "Integrations" },
  { id: "skills", label: "Skills" },
  { id: "memory", label: "Memory" },
  { id: "rules", label: "Rules" },
  { id: "apps", label: "Apps" },
];

export const SETTINGS_HUB_DIRECTORY: ReadonlyArray<{
  id: SettingsHubDirectoryId;
  label: string;
}> = [
  { id: "workspaces", label: "Workspaces" },
  { id: "activity", label: "Activity" },
];

/**
 * Settings rail with hairlines between jobs (not one flat dump).
 *
 * | Band | Rows | Job |
 * | --- | --- | --- |
 * | Browse | Workspaces, Activity | Inventory tables |
 * | You | Profile, Appearance, Layout, General, Startup | Account + look + chrome prefs |
 * | Agent | AI, Harnesses, Models | Thinking stack |
 * | Trust | Security, Host, MCP tools, Integrations | Access + Host attach + connected systems |
 * | Library | Skills, Memory, Rules, Apps | Knowledge + plugin slots |
 *
 * Appearance: Global `ui.shell` / `ui.pet` + optional per-workspace overrides.
 * `ui.forceGlobalAppearance` → Global overrides every workspace.
 */
export const SETTINGS_HUB_NAV: readonly SettingsHubNavEntry[] = [
  { type: "item", id: "workspaces", label: "Workspaces" },
  { type: "item", id: "activity", label: "Activity" },
  { type: "separator", id: "sep-browse" },
  { type: "item", id: "profile", label: "Profile" },
  { type: "item", id: "appearance", label: "Appearance" },
  { type: "item", id: "layout", label: "Layout" },
  { type: "item", id: "general", label: "General" },
  { type: "item", id: "startup", label: "Startup" },
  { type: "separator", id: "sep-you" },
  { type: "item", id: "ai", label: "AI" },
  { type: "item", id: "harnesses", label: "Harnesses" },
  { type: "item", id: "models", label: "Models" },
  { type: "separator", id: "sep-agent" },
  { type: "item", id: "security", label: "Security" },
  { type: "item", id: "host", label: "Cloud" },
  { type: "item", id: "mcp-tools", label: "MCP tools" },
  { type: "item", id: "integrations", label: "Integrations" },
  { type: "separator", id: "sep-trust" },
  { type: "item", id: "skills", label: "Skills" },
  { type: "item", id: "memory", label: "Memory" },
  { type: "item", id: "rules", label: "Rules" },
  { type: "item", id: "apps", label: "Apps" },
];

export const DEFAULT_SETTINGS_SECTION: SettingsNavSection = "general";
export const DEFAULT_SETTINGS_HUB_NAV: SettingsHubNavId = "workspaces";

export function isSettingsHubDirectoryId(
  id: string | null | undefined,
): id is SettingsHubDirectoryId {
  return id === "workspaces" || id === "activity";
}

export function isSettingsNavSection(
  id: string | null | undefined,
): id is SettingsNavSection {
  return (
    typeof id === "string" &&
    SETTINGS_NAV_SECTIONS.some((s) => s.id === id)
  );
}

/**
 * Normalize `ssect` for the Settings hub (directory + form sections).
 * - null / "" / whitespace → null (mobile list / no drill)
 * - legacy projects → workspaces
 * - legacy providers / surfaces / folders → apps
 * - legacy workspace-appearance → appearance
 * - known hub id → that id
 * - unknown → workspaces
 */
export function parseSettingsHubNav(raw: unknown): SettingsHubNavId | null {
  if (raw == null) return null;
  if (typeof raw !== "string") return DEFAULT_SETTINGS_HUB_NAV;
  const id = raw.trim().toLowerCase();
  if (!id) return null;
  if (id === "projects") return "workspaces";
  // Old Providers / Surfaces / folders browse → Apps (plugin slots)
  if (id === "providers" || id === "surfaces" || id === "folders") {
    return "apps";
  }
  if (id === "mcp-connectors") return "integrations";
  if (id === "workspace-appearance") return "appearance";
  if (isSettingsHubDirectoryId(id) || isSettingsNavSection(id)) {
    return id;
  }
  return DEFAULT_SETTINGS_HUB_NAV;
}

/** Desktop rail + body when URL has no ssect. */
export function coerceSettingsHubNav(
  nav: SettingsHubNavId | null | undefined,
): SettingsHubNavId {
  return nav ?? DEFAULT_SETTINGS_HUB_NAV;
}

/**
 * Normalize `ssect` for form-only Settings sections (AI, Profile, …).
 * Hub directory ids → null (not a form section).
 * - null / "" / whitespace → null (mobile list / no drill)
 * - unknown → general
 * - known form id → section
 */
export function parseSettingsSection(
  raw: unknown,
): SettingsNavSection | null {
  if (raw == null) return null;
  if (typeof raw !== "string") return DEFAULT_SETTINGS_SECTION;
  const id = raw.trim().toLowerCase();
  if (!id) return null;
  // Hub directory rows are not form sections
  if (
    isSettingsHubDirectoryId(id) ||
    id === "projects" ||
    id === "all"
  ) {
    return null;
  }
  // Legacy deep-links
  if (id === "mcp-connectors") return "integrations";
  if (id === "providers" || id === "surfaces" || id === "folders") {
    return "apps";
  }
  if (id === "workspace-appearance") return "appearance";
  if (isSettingsNavSection(id)) return id;
  return DEFAULT_SETTINGS_SECTION;
}

/** Desktop body + rail highlight when URL has no form ssect. */
export function coerceSettingsSection(
  section: SettingsNavSection | null | undefined,
): SettingsNavSection {
  return section ?? DEFAULT_SETTINGS_SECTION;
}
