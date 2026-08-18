/**
 * Studio shell layout prefs — Settings → Layout.
 * `chatSide` places Chat vs Workspaces/Nav/Files on left or right.
 */

export type ShellChatSide = "left" | "right";

export type StudioShellLayoutConfig = {
  /** Where the Chat rail sits. Explorer (workspaces / nav / files) is the other side. */
  chatSide: ShellChatSide;
};

export const DEFAULT_SHELL_LAYOUT: StudioShellLayoutConfig = {
  chatSide: "left",
};

export function parseShellChatSide(raw: unknown): ShellChatSide {
  if (raw === "right") return "right";
  return "left";
}

export function parseStudioShellLayout(
  raw: unknown,
): StudioShellLayoutConfig {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_SHELL_LAYOUT };
  const o = raw as Record<string, unknown>;
  return {
    chatSide: parseShellChatSide(o.chatSide),
  };
}

/** Physical start/end column role for desktop shell grid. */
export type ShellRailRole = "chat" | "explorer";

export function shellRailAtPhysicalSide(
  chatSide: ShellChatSide,
  physical: "left" | "right",
): ShellRailRole {
  switch (chatSide) {
    case "left":
      return physical === "left" ? "chat" : "explorer";
    case "right":
      return physical === "left" ? "explorer" : "chat";
    default: {
      const _exhaustive: never = chatSide;
      return _exhaustive;
    }
  }
}

/** Map rail role → panel-layout "left" (chat) / "right" (explorer) keys. */
export function panelSideForRailRole(
  role: ShellRailRole,
): "left" | "right" {
  switch (role) {
    case "chat":
      return "left";
    case "explorer":
      return "right";
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}
