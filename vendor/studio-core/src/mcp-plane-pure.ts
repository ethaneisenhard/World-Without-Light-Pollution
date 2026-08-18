/**
 * MCP plane — orthogonal to harness (brain) and model (weights).
 * Studio MCP is always available; Kody is an optional second MCP home (Kent shape).
 */

export const MCP_PLANE_IDS = ["studio", "studio+kody"] as const;
export type McpPlaneId = (typeof MCP_PLANE_IDS)[number];

/** Kent-shaped default — Kody /mcp attaches when `KODY_BASE_URL` is set. */
export const DEFAULT_MCP_PLANE: McpPlaneId = "studio+kody";

export function coerceMcpPlaneId(
  raw: string | null | undefined,
): McpPlaneId {
  const id = typeof raw === "string" ? raw.trim() : "";
  if (id === "studio+kody" || id === "studio-kody" || id === "kody+studio") {
    return "studio+kody";
  }
  if (id === "studio") return "studio";
  // Legacy / mistaken "kody alone" → attach under Studio (Studio MCP always on).
  if (id === "kody") return "studio+kody";
  return DEFAULT_MCP_PLANE;
}

export function mcpPlaneIncludesKody(plane: McpPlaneId): boolean {
  return plane === "studio+kody";
}

export function mcpPlaneOptionLabel(plane: McpPlaneId): string {
  switch (plane) {
    case "studio+kody":
      return "Studio + Kody";
    case "studio":
    default:
      return "Studio";
  }
}

/** Short face for the composer pill. */
export function mcpPlanePickerFace(plane: McpPlaneId): string {
  switch (plane) {
    case "studio+kody":
      return "Studio+Kody";
    case "studio":
    default:
      return "Studio";
  }
}

export function mcpPlaneHint(plane: McpPlaneId): string {
  switch (plane) {
    case "studio+kody":
      return "Tools: Studio MCP + Kody /mcp (Cursor/Hermes/Grok inject). Not a harness.";
    case "studio":
    default:
      return "Tools: Studio MCP only. Set ai.defaultMcpPlane to studio+kody for Kent’s /mcp.";
  }
}

/** Kody MCP URL from env-shaped inputs (no I/O). */
export function resolveKodyMcpUrl(input: {
  kodyMcpUrl?: string | null;
  kodyBaseUrl?: string | null;
}): string | null {
  const direct = (input.kodyMcpUrl ?? "").trim().replace(/\/+$/, "");
  if (direct) return direct;
  const base = (input.kodyBaseUrl ?? "").trim().replace(/\/+$/, "");
  if (!base) return null;
  return `${base}/mcp`;
}

export type McpPlaneServerEntry = {
  id: string;
  url: string;
};

/**
 * Server entries to inject for a plane.
 * Studio always; Kody only when plane includes it and URL is set.
 */
export function mcpPlaneServerEntries(input: {
  plane: McpPlaneId;
  studioMcpUrl: string;
  kodyMcpUrl: string | null;
  studioServerId?: string;
  kodyServerId?: string;
}): McpPlaneServerEntry[] {
  const studioId = input.studioServerId?.trim() || "glassbox-studio";
  const kodyId = input.kodyServerId?.trim() || "kody";
  const out: McpPlaneServerEntry[] = [
    { id: studioId, url: input.studioMcpUrl },
  ];
  if (mcpPlaneIncludesKody(input.plane) && input.kodyMcpUrl?.trim()) {
    out.push({ id: kodyId, url: input.kodyMcpUrl.trim() });
  }
  return out;
}

export function mcpPlaneChoicesForPicker(input?: {
  kodyConfigured?: boolean;
}): Array<{ id: McpPlaneId; label: string; disabled?: boolean }> {
  const kodyOk = Boolean(input?.kodyConfigured);
  return [
    { id: "studio", label: mcpPlaneOptionLabel("studio") },
    {
      id: "studio+kody",
      label: kodyOk
        ? mcpPlaneOptionLabel("studio+kody")
        : "Studio + Kody (set KODY_BASE_URL)",
      disabled: !kodyOk,
    },
  ];
}
