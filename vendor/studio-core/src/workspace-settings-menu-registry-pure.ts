/**
 * Workspace rail settings menu — registry of rows (toggles / actions / seps).
 * Host paints via projector; plugins / MCP register extras — never host `if` trees.
 */

export type WorkspaceSettingsMenuActionId =
  | "toggle-keep-tabs"
  | "open-appearance-settings"
  | (string & {});

export type WorkspaceSettingsMenuDef =
  | { kind: "separator"; id: string; order: number }
  | {
      kind: "toggle";
      id: string;
      order: number;
      label: string;
      hint?: string;
      actionId: WorkspaceSettingsMenuActionId;
    }
  | {
      kind: "action";
      id: string;
      order: number;
      label: string;
      hint?: string;
      actionId: WorkspaceSettingsMenuActionId;
    };

export type WorkspaceSettingsMenuRow =
  | { kind: "separator"; id: string }
  | {
      kind: "toggle";
      id: string;
      label: string;
      hint?: string;
      checked: boolean;
      actionId: WorkspaceSettingsMenuActionId;
    }
  | {
      kind: "action";
      id: string;
      label: string;
      hint?: string;
      actionId: WorkspaceSettingsMenuActionId;
    };

/** Built-in Workspaces gear menu — Keep tabs + Appearance settings. */
export const WORKSPACE_SETTINGS_MENU_REGISTRY: readonly WorkspaceSettingsMenuDef[] =
  [
    {
      kind: "toggle",
      id: "keep-tabs",
      order: 10,
      label: "Keep tabs",
      hint: "On — same DeskPane tabs when hopping workspaces. Off — each workspace restores its own windows.",
      actionId: "toggle-keep-tabs",
    },
    { kind: "separator", id: "sep-settings", order: 50 },
    {
      kind: "action",
      id: "open-appearance",
      order: 60,
      label: "Appearance settings",
      hint: "Open Settings → Appearance (themes, pets, keep-tabs).",
      actionId: "open-appearance-settings",
    },
  ];

const extraDefs = new Map<string, WorkspaceSettingsMenuDef>();

/** Plugin / MCP / test seam — add a row without forking the rail host. */
export function registerWorkspaceSettingsMenuItem(
  def: WorkspaceSettingsMenuDef,
): void {
  extraDefs.set(def.id, def);
}

export function unregisterWorkspaceSettingsMenuItem(id: string): void {
  extraDefs.delete(id);
}

export function clearWorkspaceSettingsMenuOverrides(): void {
  extraDefs.clear();
}

export function listWorkspaceSettingsMenuDefs(): WorkspaceSettingsMenuDef[] {
  const byId = new Map<string, WorkspaceSettingsMenuDef>();
  for (const d of WORKSPACE_SETTINGS_MENU_REGISTRY) byId.set(d.id, d);
  for (const d of extraDefs.values()) byId.set(d.id, d);
  return [...byId.values()].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

export type ProjectWorkspaceSettingsMenuRowsInput = {
  keepTabsAcross: boolean;
  /** Optional override list (tests); default = built-in + registered. */
  defs?: readonly WorkspaceSettingsMenuDef[];
};

/**
 * Project registry defs → paint rows with live toggle state.
 * Unknown toggle ids stay unchecked unless wired here.
 */
export function projectWorkspaceSettingsMenuRows(
  input: ProjectWorkspaceSettingsMenuRowsInput,
): WorkspaceSettingsMenuRow[] {
  const defs = input.defs ?? listWorkspaceSettingsMenuDefs();
  const out: WorkspaceSettingsMenuRow[] = [];
  for (const d of defs) {
    switch (d.kind) {
      case "separator":
        out.push({ kind: "separator", id: d.id });
        break;
      case "toggle": {
        let checked = false;
        switch (d.actionId) {
          case "toggle-keep-tabs":
            checked = input.keepTabsAcross;
            break;
          default:
            checked = false;
            break;
        }
        out.push({
          kind: "toggle",
          id: d.id,
          label: d.label,
          hint: d.hint,
          checked,
          actionId: d.actionId,
        });
        break;
      }
      case "action":
        out.push({
          kind: "action",
          id: d.id,
          label: d.label,
          hint: d.hint,
          actionId: d.actionId,
        });
        break;
      default: {
        const _exhaustive: never = d;
        return _exhaustive;
      }
    }
  }
  return out;
}
