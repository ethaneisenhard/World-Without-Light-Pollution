/**
 * Desk canvas — surface under DeskPane windows (not tab chrome, not window body).
 * design.json: `shell.deskCanvas` — solid (default) | image | dots; assets later.
 */

export const DESK_CANVAS_KINDS = ["solid", "image", "dots"] as const;
export type DeskCanvasKind = (typeof DESK_CANVAS_KINDS)[number];

export type DeskCanvasConfig = {
  /** Default solid — recessed mix of shell canvas. */
  kind?: DeskCanvasKind;
  /** Optional solid hex (kind solid / underlay for image). */
  color?: string;
  /** Asset URL when kind is image (project-relative or absolute). */
  imageUrl?: string;
};

/** CSS default when no design.json color — tracks fillShell canvas hue. */
export const DEFAULT_DESK_CANVAS_BG =
  "color-mix(in srgb, #000 32%, var(--as-color-bg-canvas))" as const;

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function isDeskCanvasKind(v: string): v is DeskCanvasKind {
  return (DESK_CANVAS_KINDS as readonly string[]).includes(v);
}

function cssUrl(raw: string): string {
  const escaped = raw.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `url("${escaped}")`;
}

/** Parse design.json `shell.deskCanvas` — unknown keys ignored. */
export function parseDeskCanvasConfig(
  raw: unknown,
): DeskCanvasConfig | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const kindRaw = typeof o.kind === "string" ? o.kind.trim() : "";
  const kind = kindRaw && isDeskCanvasKind(kindRaw) ? kindRaw : undefined;
  const colorRaw = typeof o.color === "string" ? o.color.trim() : "";
  const color = colorRaw && HEX_RE.test(colorRaw) ? colorRaw : undefined;
  const imageRaw = typeof o.imageUrl === "string" ? o.imageUrl.trim() : "";
  const imageUrl =
    imageRaw && imageRaw.length <= 2048 && !imageRaw.includes("\n")
      ? imageRaw
      : undefined;
  if (!kind && !color && !imageUrl) return undefined;
  return {
    ...(kind ? { kind } : {}),
    ...(color ? { color } : {}),
    ...(imageUrl ? { imageUrl } : {}),
  };
}

/**
 * CSS custom properties for desk well under windows.
 * Always sets image/size/repeat so prior project paint cannot stick.
 */
export function deskCanvasCssVars(
  config?: DeskCanvasConfig | null,
): Record<string, string> {
  const kind: DeskCanvasKind =
    config?.kind ??
    (config?.imageUrl ? "image" : config?.color ? "solid" : "solid");

  const vars: Record<string, string> = {
    "--as-color-bg-desk": config?.color?.trim() || DEFAULT_DESK_CANVAS_BG,
    "--as-desk-canvas-image": "none",
    "--as-desk-canvas-size": "auto",
    "--as-desk-canvas-repeat": "no-repeat",
    "--as-desk-canvas-position": "center",
  };

  if (kind === "image" && config?.imageUrl) {
    vars["--as-desk-canvas-image"] = cssUrl(config.imageUrl);
    vars["--as-desk-canvas-size"] = "cover";
    vars["--as-desk-canvas-repeat"] = "no-repeat";
    vars["--as-desk-canvas-position"] = "center";
  } else if (kind === "dots") {
    vars["--as-desk-canvas-image"] =
      "radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--as-color-border-default) 45%, transparent) 1px, transparent 0)";
    vars["--as-desk-canvas-size"] = "16px 16px";
    vars["--as-desk-canvas-repeat"] = "repeat";
  }

  return vars;
}

/** Layer shorthand for `#studio-wm-host` / stage (color + optional image/dots). */
export function deskCanvasBackgroundShorthand(): string {
  return [
    "var(--as-desk-canvas-image, none)",
    "var(--as-color-bg-desk, var(--as-color-bg-canvas))",
  ].join(", ");
}
