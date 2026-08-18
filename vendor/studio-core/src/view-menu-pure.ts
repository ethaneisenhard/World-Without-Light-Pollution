/**
 * Topbar View menu — OS-style window selector (checkmarks = open).
 * Ids match Studio canvas URL flags / DeskPane kinds.
 * Groups derived from `CANVAS_WINDOW_REGISTRY`.
 */

import {
  CANVAS_WINDOW_REGISTRY,
  canvasWindowById,
  canvasWindowIds,
  deriveViewMenuGroups,
  resolveCanvasWindowPresentation,
  visibleViewMenuGroups,
  type CanvasWindowVisibilityContext,
  type StudioCanvasWindowId,
} from "./canvas-window-registry-pure.js";

/** All canvas window ids (including those omitted from View menu). */
export type ViewMenuItemId = StudioCanvasWindowId;

export type ViewMenuItemDef = {
  id: ViewMenuItemId;
  label: string;
  /** Short hint for title / aria. */
  hint: string;
};

export type ViewMenuGroup = {
  id: string;
  items: readonly ViewMenuItemDef[];
};

export type ViewMenuOpenState = Partial<Record<ViewMenuItemId, boolean>>;

export type ViewMenuRow =
  | { kind: "separator"; key: string }
  | {
      kind: "item";
      id: ViewMenuItemId;
      label: string;
      hint: string;
      checked: boolean;
    };

/** Logical groups — mirrors traditional Window/View menus. */
export const VIEW_MENU_GROUPS: readonly ViewMenuGroup[] =
  deriveViewMenuGroups(CANVAS_WINDOW_REGISTRY);

export function viewMenuItemIds(): readonly ViewMenuItemId[] {
  return VIEW_MENU_GROUPS.flatMap((g) => g.items.map((i) => i.id));
}

/** Human label for a canvas / View-menu kind id (Forms, Code, …). */
export function viewMenuLabelForId(
  id: string,
  ctx?: CanvasWindowVisibilityContext,
): string {
  const needle = id.trim();
  if (!needle) return id;
  const def = canvasWindowById(needle);
  if (def) return resolveCanvasWindowPresentation(def, ctx ?? {}).label;
  for (const group of VIEW_MENU_GROUPS) {
    for (const item of group.items) {
      if (item.id === needle) return item.label;
    }
  }
  return needle;
}

/** Flat rows with separators between groups — for OS-style menu render. */
export function projectViewMenuRows(
  open: ViewMenuOpenState,
  ctx?: CanvasWindowVisibilityContext,
): ViewMenuRow[] {
  const rows: ViewMenuRow[] = [];
  const groups = visibleViewMenuGroups(ctx ?? {});
  groups.forEach((group, gi) => {
    if (gi > 0) {
      rows.push({ kind: "separator", key: `sep-${group.id}` });
    }
    for (const item of group.items) {
      rows.push({
        kind: "item",
        id: item.id,
        label: item.label,
        hint: item.hint,
        checked: open[item.id] === true,
      });
    }
  });
  return rows;
}

export function countOpenViews(open: ViewMenuOpenState): number {
  return viewMenuItemIds().reduce(
    (n, id) => n + (open[id] === true ? 1 : 0),
    0,
  );
}

/** Every registered canvas id (menu + non-menu). */
export function allCanvasWindowIds(): readonly ViewMenuItemId[] {
  return canvasWindowIds();
}
