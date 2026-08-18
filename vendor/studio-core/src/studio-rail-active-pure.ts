/**
 * STUDIO Home rail active — same global page whether a workspace is selected
 * or not. Active when Home is focused (not “keep open on switch”).
 */

export function isStudioHomeRailActive(input: {
  /** URL / active workspace id — empty = Global Studio. */
  projectId?: string | null;
  focusedKind?: string | null;
}): boolean {
  const focus = input.focusedKind?.trim() ?? "";
  if (focus === "home") return true;
  const pid = input.projectId?.trim() ?? "";
  // Global shell default (no canvas focus yet) — Home is the landing face.
  if (!pid && !focus) return true;
  return false;
}

export function isStudioRailWindowActive(input: {
  windowId: string;
  projectId?: string | null;
  focusedKind?: string | null;
}): boolean {
  if (input.windowId === "home") {
    return isStudioHomeRailActive(input);
  }
  return (input.focusedKind?.trim() ?? "") === input.windowId;
}
