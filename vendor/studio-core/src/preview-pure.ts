const EXT_TO_LANG: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  mjs: "javascript",
  cjs: "javascript",
  json: "json",
  jsonc: "json",
  md: "markdown",
  mdx: "mdx",
  css: "css",
  html: "html",
  yml: "yaml",
  yaml: "yaml",
  sh: "bash",
  sql: "sql",
};

export function filePathToLanguage(filePath: string): string {
  const name = filePath.split("/").pop() ?? filePath;
  const ext = name.includes(".") ? name.split(".").pop()?.toLowerCase() : "";
  return EXT_TO_LANG[ext ?? ""] ?? "text";
}

export function isCodePreviewPath(filePath: string): boolean {
  const lang = filePathToLanguage(filePath);
  return lang !== "text";
}

/**
 * `.md` only — ProseMirror markdown schema (not MDX/JSX).
 * Used for Markdown ↔ WYSIWYM editor surface.
 */
export function isMarkdownProsePath(filePath: string): boolean {
  return filePathToLanguage(filePath) === "markdown";
}

/** Device ids — aligned with BrowserUI `apps/studio/src/viewport/index.ts`. */
export type PreviewViewportId = "desktop" | "tablet" | "mobile";

/** Toolbar mode — single device or all three side-by-side. */
export type PreviewViewportMode = PreviewViewportId | "all";

export type PreviewViewportSpec = {
  id: PreviewViewportId;
  label: string;
  width: number;
  height: number;
};

/** @deprecated Use PreviewViewportId — kept for call sites mid-migration. */
export type PreviewViewport = PreviewViewportId;

export const PREVIEW_VIEWPORTS: Readonly<Record<PreviewViewportId, PreviewViewportSpec>> =
  Object.freeze({
    desktop: { id: "desktop", label: "Desktop", width: 1280, height: 800 },
    tablet: { id: "tablet", label: "Tablet", width: 820, height: 1180 },
    mobile: { id: "mobile", label: "Mobile", width: 390, height: 844 },
  });

export const PREVIEW_VIEWPORT_ORDER: readonly PreviewViewportId[] = [
  "desktop",
  "tablet",
  "mobile",
];

export const PREVIEW_VIEWPORT_MODES: readonly PreviewViewportMode[] = [
  "desktop",
  "tablet",
  "mobile",
  "all",
];

/** Width lookup — BrowserUI device widths. */
export const PREVIEW_VIEWPORT_WIDTH: Record<PreviewViewportId, number> = {
  desktop: PREVIEW_VIEWPORTS.desktop.width,
  tablet: PREVIEW_VIEWPORTS.tablet.width,
  mobile: PREVIEW_VIEWPORTS.mobile.width,
};

/** Scale factor for "all" compare thumbnails (BrowserUI `ALL_VIEW_SCALE`). */
export const PREVIEW_ALL_VIEW_SCALE = 0.35;

/** Chrome bar above each pane frame (BrowserUI `PANE_CHROME_HEIGHT`). */
export const PREVIEW_PANE_CHROME_HEIGHT = 28;

/** Gap between panes in all-mode (BrowserUI `ALL_VIEW_PANE_GAP`). */
export const PREVIEW_ALL_VIEW_PANE_GAP = 18;

/**
 * Pane width at/below which All view stacks (must match `@container studio-pane`
 * in `studio.css` — phone or skinny split column).
 */
export const PREVIEW_ALL_VIEW_STACK_AT = 560;

/** Horizontal inset when fitting pane width (matches stage padding). */
export const PREVIEW_CANVAS_GUTTER = 48;

/** Vertical inset when fitting pane height (matches stage padding). */
export const PREVIEW_CANVAS_HEIGHT_GUTTER = 48;

/** All-mode layout — row on wide panes, stack on narrow. */
export type PreviewAllViewLayout = "row" | "stack";

/**
 * Stack when Live pane is phone-narrow or a skinny split column.
 * Uses stage/pane width (not viewport media).
 */
export function resolveAllViewLayout(
  containerWidth?: number,
): PreviewAllViewLayout {
  if (containerWidth == null) return "row";
  return containerWidth <= PREVIEW_ALL_VIEW_STACK_AT ? "stack" : "row";
}

export function paneViewportCssVars(id: PreviewViewportId): {
  "--as-viewport-width": string;
  "--as-viewport-height": string;
} {
  const spec = PREVIEW_VIEWPORTS[id];
  return {
    "--as-viewport-width": `${spec.width}px`,
    "--as-viewport-height": `${spec.height}px`,
  };
}

/**
 * Layout footprint of a scaled thumbnail.
 * Clip box = frame × scale (chrome sits outside the clip — BrowserUI pattern).
 */
export function scaledPaneFootprint(
  spec: Pick<PreviewViewportSpec, "width" | "height">,
  scale: number = PREVIEW_ALL_VIEW_SCALE,
): {
  frameWidth: number;
  frameHeight: number;
  clipWidth: number;
  clipHeight: number;
  scale: number;
} {
  const frameWidth = spec.width;
  const frameHeight = spec.height;
  return {
    frameWidth,
    frameHeight,
    clipWidth: frameWidth * scale,
    clipHeight: frameHeight * scale,
    scale,
  };
}

/**
 * Single-pane fit — scale down when device px would overflow the canvas.
 * Never scales above 1.0. BrowserUI `resolveSingleViewScale`.
 */
export function resolveSingleViewScale(
  viewportId: PreviewViewportId,
  containerWidth?: number,
  containerHeight?: number,
): number {
  const spec = PREVIEW_VIEWPORTS[viewportId];
  let scale = 1;
  let hasConstraint = false;

  if (containerWidth != null) {
    const availableW = Math.max(160, containerWidth - PREVIEW_CANVAS_GUTTER);
    scale = Math.min(scale, availableW / spec.width);
    hasConstraint = true;
  }

  if (containerHeight != null) {
    const fitH = Math.max(120, containerHeight - PREVIEW_CANVAS_HEIGHT_GUTTER);
    scale = Math.min(scale, fitH / (spec.height + PREVIEW_PANE_CHROME_HEIGHT));
    hasConstraint = true;
  }

  if (!hasConstraint) return 1;
  return Math.min(1, Math.max(0.2, scale));
}

/**
 * Fit all three thumbnails into the scrollport — width + height, never above
 * {@link PREVIEW_ALL_VIEW_SCALE}. Stack layout uses max device width (vertical
 * scroll OK); row layout uses side-by-side total width.
 */
export function resolveAllViewScale(
  containerWidth?: number,
  containerHeight?: number,
  layout: PreviewAllViewLayout = resolveAllViewLayout(containerWidth),
): number {
  const maxDeviceWidth = Math.max(
    ...PREVIEW_VIEWPORT_ORDER.map((id) => PREVIEW_VIEWPORTS[id].width),
  );
  const rowWidth =
    PREVIEW_VIEWPORT_ORDER.reduce((sum, id) => sum + PREVIEW_VIEWPORTS[id].width, 0) +
    PREVIEW_ALL_VIEW_PANE_GAP * (PREVIEW_VIEWPORT_ORDER.length - 1);
  const fitWidth = layout === "stack" ? maxDeviceWidth : rowWidth;
  const maxDeviceHeight = Math.max(
    ...PREVIEW_VIEWPORT_ORDER.map((id) => PREVIEW_VIEWPORTS[id].height),
  );
  // Stack scrolls; only fit one pane height. Row still fits one row height.
  const paneFitHeight = maxDeviceHeight + PREVIEW_PANE_CHROME_HEIGHT;

  let scale = PREVIEW_ALL_VIEW_SCALE;
  let hasConstraint = false;

  if (containerWidth != null) {
    const availableW = Math.max(160, containerWidth - PREVIEW_CANVAS_GUTTER);
    scale = Math.min(scale, availableW / fitWidth);
    hasConstraint = true;
  }

  // Row: fit one row into the viewport height. Stack scrolls — skip height crush.
  if (layout === "row" && containerHeight != null) {
    const fitH = Math.max(120, containerHeight - PREVIEW_CANVAS_HEIGHT_GUTTER);
    scale = Math.min(scale, fitH / paneFitHeight);
    hasConstraint = true;
  }

  if (!hasConstraint) return PREVIEW_ALL_VIEW_SCALE;
  return Math.max(0.2, scale);
}

export function isPreviewViewportMode(value: string): value is PreviewViewportMode {
  return (PREVIEW_VIEWPORT_MODES as readonly string[]).includes(value);
}

/** Device↔device keeps one iframe (morph). Crossing `all` remounts → crossfade. */
export function liveViewportSwitchKind(
  from: PreviewViewportMode,
  to: PreviewViewportMode,
): "noop" | "morph" | "crossfade" {
  if (from === to) return "noop";
  if (from === "all" || to === "all") return "crossfade";
  return "morph";
}

/**
 * Compact shell: keep All; single-device picks stay as chosen (fill only for mobile).
 */
export function coerceLiveViewportForCompact(
  mode: PreviewViewportMode,
  shellCompact: boolean,
): PreviewViewportMode {
  if (!shellCompact) return mode;
  return mode;
}

/**
 * Live always uses framed device panes (never edge-to-edge fill).
 * Framed + stage padding reads as a preview on phone and desktop alike.
 *
 * @deprecated Always false — kept for call-site compatibility.
 */
export function livePreviewUsesFillLayout(
  _shellCompact?: boolean,
  _mode?: PreviewViewportMode,
): boolean {
  return false;
}

/**
 * Normalize Website Preview path-bar input → site path only (no host).
 * Full URLs keep pathname; query/hash dropped so the bar stays path-shaped.
 */
export function normalizeLivePreviewPathInput(raw: string): string {
  let s = raw.trim();
  if (!s) return "/";
  try {
    if (/^https?:\/\//i.test(s) || s.startsWith("//")) {
      const u = new URL(s.startsWith("//") ? `http:${s}` : s);
      s = u.pathname || "/";
    }
  } catch {
    /* keep s */
  }
  s = s.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]+/i, "");
  const q = s.indexOf("?");
  if (q >= 0) s = s.slice(0, q);
  const h = s.indexOf("#");
  if (h >= 0) s = s.slice(0, h);
  s = s.trim();
  if (!s || s === "/") return "/";
  if (!s.startsWith("/")) s = `/${s}`;
  s = s.replace(/\/{2,}/g, "/");
  if (s.length > 1 && s.endsWith("/")) s = s.slice(0, -1);
  return s || "/";
}

/** Toolbar label for a Live viewport mode. */
export function previewViewportModeLabel(mode: PreviewViewportMode): string {
  if (mode === "all") return "All";
  return PREVIEW_VIEWPORTS[mode].label;
}

/** Live toolbar modes — Desktop / Tablet / Mobile / All. */
export function liveViewportModesForShell(
  _shellCompact?: boolean,
): readonly PreviewViewportMode[] {
  return PREVIEW_VIEWPORT_MODES;
}

/**
 * @deprecated Prefer {@link liveViewportModesForShell}.
 */
export function liveViewportModesForIconToolbar(): readonly PreviewViewportMode[] {
  return PREVIEW_VIEWPORT_MODES;
}

/** Compact shell: Inspect panel is a bottom drawer, not a side rail. */
export function liveInspectChromeKind(
  shellCompact: boolean,
): "rail" | "drawer" {
  return shellCompact ? "drawer" : "rail";
}

/** Crossfade timings (ms) — exit then enter. */
export const LIVE_VIEWPORT_CROSSFADE_MS = {
  exit: 180,
  enter: 280,
} as const;

