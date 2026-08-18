/**
 * Design window surfaces — shareable via URL `ds=`.
 * Client iframe helpers stay in apps/studio; ids/labels live here (MCP + nav).
 */

export const DESIGN_STUDIO_SURFACE_IDS = [
  "home",
  "system",
  "components",
  "chrome",
] as const;

export type DesignStudioSurface = (typeof DESIGN_STUDIO_SURFACE_IDS)[number];

export const DESIGN_STUDIO_SURFACES: readonly {
  id: DesignStudioSurface;
  label: string;
  hint: string;
}[] = [
  {
    id: "home",
    label: "Home",
    hint: "Brand overview + links (project)",
  },
  {
    id: "system",
    label: "System",
    hint: "Token atlas (project)",
  },
  {
    id: "components",
    label: "Components",
    hint: "Library + sandboxes (project)",
  },
  {
    id: "chrome",
    label: "Chrome",
    hint: "ui-* packages dogfood",
  },
] as const;

export function parseDesignStudioSurface(
  raw: string | null | undefined,
): DesignStudioSurface {
  const v = String(raw ?? "")
    .trim()
    .toLowerCase();
  switch (v) {
    case "home":
    case "system":
    case "components":
    case "chrome":
      return v;
    default:
      return "home";
  }
}

/** Strict parse for MCP / studio.nav — unknown ids error (empty → home). */
export function parseDesignStudioSurfaceInput(
  raw: unknown,
):
  | { ok: true; value: DesignStudioSurface }
  | { ok: false; error: string } {
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return { ok: true, value: "home" };
  }
  if (typeof raw !== "string") {
    return {
      ok: false,
      error: "Unknown ds (home|system|components|chrome)",
    };
  }
  const v = raw.trim().toLowerCase();
  switch (v) {
    case "home":
    case "system":
    case "components":
    case "chrome":
      return { ok: true, value: v };
    default:
      return {
        ok: false,
        error: `Unknown ds: ${raw} (home|system|components|chrome)`,
      };
  }
}
