/**
 * Access-mode levers — copy + capability matrix for Settings / chat chrome.
 * Product: Cursor-class computer access, visual toggles (not a buried select).
 */

import type { AccessMode } from "./access-mode-pure.js";

export type AccessCapabilityId =
  | "shell"
  | "files"
  | "git"
  | "mcp"
  | "autoApprove"
  | "studioPaths"
  | "toolAllowlist";

export type AccessCapabilityRow = {
  id: AccessCapabilityId;
  label: string;
  /** Short hint under the label. */
  hint: string;
  /** Whether this capability is on in this mode. */
  on: boolean;
};

export type AccessModeCard = {
  mode: AccessMode;
  title: string;
  eyebrow: string;
  lead: string;
  capabilities: AccessCapabilityRow[];
};

const CAP_META: Record<
  AccessCapabilityId,
  { label: string; hint: string }
> = {
  shell: {
    label: "Shell / CLI on Host",
    hint: "shell.run = login shell on the attached Host (not the browser)",
  },
  files: {
    label: "Files read / write",
    hint: "Project tree + Keep/Undo writes",
  },
  git: {
    label: "Git status / commit / push",
    hint: "Repo ops on the active project",
  },
  mcp: {
    label: "MCP + integrations",
    hint: "n8n and configured MCP servers",
  },
  autoApprove: {
    label: "Auto-approve push / deploy",
    hint: "Skip approval gate for ship actions",
  },
  studioPaths: {
    label: "@studio/ / @ws/ file roots",
    hint: "Global Chat disk roots (ai.globalFileAccess) — not gated by this mode",
  },
  toolAllowlist: {
    label: "Tool allowlists",
    hint: "Settings → MCP tool toggles still apply",
  },
};

/** Capability matrix for a mode — drives Settings levers + chat strip. */
export function accessModeCapabilities(
  mode: AccessMode,
): AccessCapabilityRow[] {
  const all = mode === "all";
  const ids: AccessCapabilityId[] = [
    "shell",
    "files",
    "git",
    "mcp",
    "autoApprove",
    "studioPaths",
    "toolAllowlist",
  ];
  return ids.map((id) => {
    const meta = CAP_META[id];
    let on = false;
    switch (id) {
      case "toolAllowlist":
        on = !all;
        break;
      case "autoApprove":
        on = all;
        break;
      case "studioPaths":
        // Global file access defaults on; accessMode only owns approvals / catalog.
        on = true;
        break;
      default:
        // shell / files / git / mcp — available in both; full = unrestricted catalog
        on = true;
        break;
    }
    return { id, label: meta.label, hint: meta.hint, on };
  });
}

export function accessModeCards(): AccessModeCard[] {
  return [
    {
      mode: "all",
      title: "Full computer access",
      eyebrow: "Like Cursor Agent",
      lead: "Full tool catalog + shell.run on the attached Host (install CLIs, gh, brew/apt). Turns Security NOPE off. Auto-approve push/deploy. Runs on whichever Host this shell is attached to — laptop or cloud.",
      capabilities: accessModeCapabilities("all"),
    },
    {
      mode: "guarded",
      title: "Guarded",
      eyebrow: "Allowlists + approve",
      lead: "Allowlists + Approve for push/deploy. Restores balanced Security NOPE. Shell still available for safer commands; risky installs may be blocked until you switch to Full computer access.",
      capabilities: accessModeCapabilities("guarded"),
    },
  ];
}

export function accessModeChipLabel(mode: AccessMode): string {
  return mode === "all" ? "Full access" : "Guarded";
}
