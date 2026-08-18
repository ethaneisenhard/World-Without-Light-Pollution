/**
 * Builtin Home widget registry — ids, kinds, size policy.
 * Pure — no DOM. Client maps ids → render factories.
 */

export type HomeWidgetKind = "peek" | "launch";

export type HomeWidgetSize = {
  w: number;
  h: number;
};

export type HomeWidgetDef = {
  id: string;
  label: string;
  description: string;
  kind: HomeWidgetKind;
  /** Default span on the Home grid. */
  defaultSize: HomeWidgetSize;
  /**
   * Size presets (cycle + default). Free drag-resize allows any integer
   * span inside the bounding box of these presets (minW..maxW × minH..maxH).
   */
  sizes: readonly HomeWidgetSize[];
  /** When true, instance may carry `props.kind` (canvas kind) etc. */
  acceptsProps?: boolean;
};

export const HOME_GRID_COLS_DESKTOP = 4;
export const HOME_GRID_COLS_COMPACT = 2;

export const HOME_WIDGET_REGISTRY: readonly HomeWidgetDef[] = [
  {
    id: "greeting",
    label: "Greeting",
    description: "Welcome line using profile display name",
    kind: "peek",
    defaultSize: { w: 2, h: 1 },
    sizes: [
      { w: 2, h: 1 },
      { w: 3, h: 1 },
      { w: 4, h: 1 },
      { w: 2, h: 2 },
      { w: 4, h: 2 },
    ],
  },
  {
    id: "activity",
    label: "Activity",
    description: "Recent chats and calendar events",
    kind: "peek",
    defaultSize: { w: 2, h: 2 },
    // Cap h at 2 so Activity stays band-aligned with Calendar (uniform Home).
    sizes: [
      { w: 1, h: 1 },
      { w: 2, h: 1 },
      { w: 2, h: 2 },
      { w: 3, h: 2 },
      { w: 4, h: 2 },
    ],
  },
  {
    id: "calendar-week",
    label: "Calendar week",
    description: "Compact week strip — opens Calendar",
    kind: "peek",
    defaultSize: { w: 2, h: 2 },
    sizes: [
      { w: 1, h: 1 },
      { w: 2, h: 1 },
      { w: 2, h: 2 },
      { w: 3, h: 2 },
      { w: 4, h: 2 },
    ],
  },
  {
    id: "workspaces",
    label: "Workspaces",
    description: "Workspace chips — select or open",
    kind: "peek",
    defaultSize: { w: 2, h: 1 },
    sizes: [
      { w: 1, h: 1 },
      { w: 2, h: 1 },
      { w: 3, h: 1 },
      { w: 4, h: 1 },
      { w: 2, h: 2 },
      { w: 4, h: 2 },
    ],
  },
  {
    id: "app-launcher",
    label: "App launcher",
    description: "Open a DeskPane window (props.kind = canvas kind)",
    kind: "launch",
    defaultSize: { w: 1, h: 2 },
    sizes: [
      { w: 1, h: 2 },
      { w: 1, h: 1 },
      { w: 2, h: 1 },
      { w: 2, h: 2 },
    ],
    acceptsProps: true,
  },
  {
    id: "apps-folder",
    label: "Apps folder",
    description: "Group of app launchers (props.kinds = canvas kinds)",
    kind: "launch",
    defaultSize: { w: 2, h: 2 },
    sizes: [
      { w: 1, h: 1 },
      { w: 2, h: 1 },
      { w: 2, h: 2 },
      { w: 3, h: 2 },
      { w: 4, h: 2 },
      { w: 2, h: 3 },
    ],
    acceptsProps: true,
  },
] as const;

const BY_ID = new Map(HOME_WIDGET_REGISTRY.map((d) => [d.id, d]));

export function getHomeWidgetDef(id: string): HomeWidgetDef | undefined {
  return BY_ID.get(id);
}

export function listHomeWidgetDefs(): readonly HomeWidgetDef[] {
  return HOME_WIDGET_REGISTRY;
}

export function isKnownHomeWidgetId(id: string): boolean {
  return BY_ID.has(id);
}

/** Peek widgets auto-size height to content; launch widgets stay manual w×h. */
export function homeWidgetSizeToContent(widgetId: string): boolean {
  return BY_ID.get(widgetId)?.kind === "peek";
}

/** Bounding box of registry presets — GridStack free-resize lives inside this. */
export function homeWidgetSizeBounds(widgetId: string): {
  minW: number;
  minH: number;
  maxW: number;
  maxH: number;
} | null {
  const def = BY_ID.get(widgetId);
  if (!def || def.sizes.length === 0) return null;
  let minW = Infinity;
  let minH = Infinity;
  let maxW = 0;
  let maxH = 0;
  for (const s of def.sizes) {
    minW = Math.min(minW, s.w);
    minH = Math.min(minH, s.h);
    maxW = Math.max(maxW, s.w);
    maxH = Math.max(maxH, s.h);
  }
  return { minW, minH, maxW, maxH };
}

/**
 * True when w×h is an integer inside the widget's size bounds.
 * Preset list is for cycle defaults; drag-resize may use any cell in the box.
 */
export function sizeAllowedForWidget(
  widgetId: string,
  w: number,
  h: number,
): boolean {
  if (!Number.isInteger(w) || !Number.isInteger(h)) return false;
  const b = homeWidgetSizeBounds(widgetId);
  if (!b) return false;
  return w >= b.minW && w <= b.maxW && h >= b.minH && h <= b.maxH;
}

/** Clamp w×h into registry bounds (for GridStack save → persist). */
export function clampWidgetSize(
  widgetId: string,
  w: number,
  h: number,
): HomeWidgetSize {
  const b = homeWidgetSizeBounds(widgetId);
  if (!b) {
    return {
      w: Math.max(1, Math.floor(w) || 1),
      h: Math.max(1, Math.floor(h) || 1),
    };
  }
  return {
    w: Math.min(b.maxW, Math.max(b.minW, Math.floor(w))),
    h: Math.min(b.maxH, Math.max(b.minH, Math.floor(h))),
  };
}

/** Cycle to the next allowed size (or null when only one size). */
export function nextHomeWidgetSize(
  widgetId: string,
  w: number,
  h: number,
): HomeWidgetSize | null {
  const def = BY_ID.get(widgetId);
  if (!def || def.sizes.length < 2) return null;
  const i = def.sizes.findIndex((s) => s.w === w && s.h === h);
  const next = def.sizes[(i < 0 ? 0 : i + 1) % def.sizes.length]!;
  return { w: next.w, h: next.h };
}

/** Greeting title — uses Profile display name when set. */
export function homeGreetingTitle(displayName: string | null | undefined): string {
  const name = typeof displayName === "string" ? displayName.trim() : "";
  return name ? `Welcome in, ${name}` : "Welcome in";
}

/**
 * Greeting subtitle. When name missing, UI should treat as Profile CTA
 * (`needsProfileName`).
 */
export function homeGreetingSubtitle(displayName: string | null | undefined): {
  text: string;
  needsProfileName: boolean;
} {
  const name = typeof displayName === "string" ? displayName.trim() : "";
  if (name) {
    return { text: "Your studio at a glance", needsProfileName: false };
  }
  return { text: "Add your name in Profile", needsProfileName: true };
}
