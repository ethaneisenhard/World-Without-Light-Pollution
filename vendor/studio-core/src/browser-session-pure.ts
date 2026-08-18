/**
 * Studio Browser — pure validation / projections (no Playwright).
 */

export type BrowserSessionStatus = {
  running: boolean;
  url: string;
  title: string;
  viewport: { width: number; height: number };
  /** Real OS Chromium window (Hermes-style) vs headless. */
  headed: boolean;
};

export type BrowserNavigateInput = {
  url: string;
};

export type BrowserClickInput = {
  /** Viewport X (CSS px), same space as screencast. */
  x: number;
  /** Viewport Y (CSS px). */
  y: number;
  button?: "left" | "right" | "middle";
  clickCount?: number;
};

export type BrowserTypeInput = {
  text: string;
  /** Clear focused field before type. */
  clear?: boolean;
};

export type BrowserKeysInput = {
  /** Playwright key string — e.g. Enter, Meta+a, Escape. */
  key: string;
};

const DEFAULT_VIEWPORT = { width: 1280, height: 800 } as const;

/** Screencast JPEG quality 1–100 — low values look muddy when stretched. */
export const BROWSER_SCREENCAST_JPEG_QUALITY = 88;

/** Cap CDP frame size (device px) so Retina panes stay sharp without huge frames. */
export const BROWSER_SCREENCAST_MAX_EDGE = 2880;

export function defaultBrowserViewport(): {
  width: number;
  height: number;
} {
  return { ...DEFAULT_VIEWPORT };
}

/**
 * CDP screencast maxWidth/maxHeight in device pixels.
 * Viewport is CSS px; multiply by deviceScaleFactor or frames look soft on Retina.
 */
export function screencastFrameSize(input: {
  viewportWidth: number;
  viewportHeight: number;
  deviceScaleFactor?: number;
  maxEdge?: number;
}): { maxWidth: number; maxHeight: number } {
  const dpr = Math.min(3, Math.max(1, input.deviceScaleFactor ?? 2));
  const maxEdge = input.maxEdge ?? BROWSER_SCREENCAST_MAX_EDGE;
  let maxWidth = Math.round(input.viewportWidth * dpr);
  let maxHeight = Math.round(input.viewportHeight * dpr);
  const long = Math.max(maxWidth, maxHeight);
  if (long > maxEdge && long > 0) {
    const scale = maxEdge / long;
    maxWidth = Math.max(1, Math.round(maxWidth * scale));
    maxHeight = Math.max(1, Math.round(maxHeight * scale));
  }
  return { maxWidth, maxHeight };
}

export function idleBrowserSessionStatus(): BrowserSessionStatus {
  return {
    running: false,
    url: "about:blank",
    title: "",
    viewport: defaultBrowserViewport(),
    headed: true,
  };
}

/**
 * Prefer a real Chromium window (headed) on Mac/Windows / when DISPLAY is set.
 * Override: AS_BROWSER_HEADED=0|1
 */
export function resolveBrowserHeaded(
  env: { AS_BROWSER_HEADED?: string; DISPLAY?: string } = {},
  platform: string = "darwin",
): boolean {
  const raw = env.AS_BROWSER_HEADED?.trim().toLowerCase();
  switch (raw) {
    case "0":
    case "false":
    case "no":
      return false;
    case "1":
    case "true":
    case "yes":
      return true;
    default:
      break;
  }
  if (platform === "darwin" || platform === "win32") return true;
  return Boolean(env.DISPLAY?.trim());
}

/** Normalize user/agent URL — add https:// when bare host. */
export function normalizeBrowserUrl(raw: string):
  | { ok: true; url: string }
  | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: "url required" };
  if (trimmed === "about:blank") return { ok: true, url: trimmed };
  let candidate = trimmed;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(candidate)) {
    candidate = `https://${candidate}`;
  }
  try {
    const u = new URL(candidate);
    if (u.protocol !== "http:" && u.protocol !== "https:" && u.protocol !== "about:") {
      return { ok: false, error: `unsupported protocol: ${u.protocol}` };
    }
    return { ok: true, url: u.toString() };
  } catch {
    return { ok: false, error: "invalid url" };
  }
}

export function parseBrowserNavigateInput(
  input: Record<string, unknown>,
): { ok: true; value: BrowserNavigateInput } | { ok: false; error: string } {
  const raw = typeof input.url === "string" ? input.url : "";
  const norm = normalizeBrowserUrl(raw);
  if (!norm.ok) return norm;
  return { ok: true, value: { url: norm.url } };
}

export function parseBrowserClickInput(
  input: Record<string, unknown>,
): { ok: true; value: BrowserClickInput } | { ok: false; error: string } {
  const x = typeof input.x === "number" ? input.x : Number(input.x);
  const y = typeof input.y === "number" ? input.y : Number(input.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return { ok: false, error: "x and y required (numbers)" };
  }
  const buttonRaw =
    typeof input.button === "string" ? input.button.trim() : "left";
  let button: BrowserClickInput["button"] = "left";
  switch (buttonRaw) {
    case "left":
    case "right":
    case "middle":
      button = buttonRaw;
      break;
    default:
      return { ok: false, error: "button must be left|right|middle" };
  }
  const clickCountRaw =
    typeof input.clickCount === "number"
      ? input.clickCount
      : Number(input.clickCount ?? 1);
  const clickCount = Number.isFinite(clickCountRaw)
    ? Math.max(1, Math.min(3, Math.floor(clickCountRaw)))
    : 1;
  return { ok: true, value: { x, y, button, clickCount } };
}

export function parseBrowserTypeInput(
  input: Record<string, unknown>,
): { ok: true; value: BrowserTypeInput } | { ok: false; error: string } {
  if (typeof input.text !== "string") {
    return { ok: false, error: "text required" };
  }
  return {
    ok: true,
    value: {
      text: input.text,
      clear: input.clear === true,
    },
  };
}

export function parseBrowserKeysInput(
  input: Record<string, unknown>,
): { ok: true; value: BrowserKeysInput } | { ok: false; error: string } {
  const key = typeof input.key === "string" ? input.key.trim() : "";
  if (!key) return { ok: false, error: "key required" };
  return { ok: true, value: { key } };
}

/**
 * Map click on displayed screencast (element rect) → page viewport coords.
 */
export function mapScreencastClickToViewport(input: {
  clientX: number;
  clientY: number;
  displayWidth: number;
  displayHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}): { x: number; y: number } | null {
  const {
    clientX,
    clientY,
    displayWidth,
    displayHeight,
    viewportWidth,
    viewportHeight,
  } = input;
  if (
    displayWidth <= 0 ||
    displayHeight <= 0 ||
    viewportWidth <= 0 ||
    viewportHeight <= 0
  ) {
    return null;
  }
  const x = (clientX / displayWidth) * viewportWidth;
  const y = (clientY / displayHeight) * viewportHeight;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}
