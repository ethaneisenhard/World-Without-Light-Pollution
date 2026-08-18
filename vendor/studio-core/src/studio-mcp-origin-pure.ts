/**
 * Single source of truth for Studio MCP HTTP origin (Host CLI / peer inject).
 * Desk browser proxy (`STUDIO_API_PROXY`) is not this — CLI hits Host loopback unless overridden.
 */

export function resolveStudioMcpOrigin(
  env: { STUDIO_API_ORIGIN?: string | undefined } = {},
): string {
  const raw = env.STUDIO_API_ORIGIN?.trim();
  if (raw) return raw.replace(/\/+$/, "");
  return "http://127.0.0.1:3847";
}

export function buildStudioMcpUrlFromOrigin(input: {
  origin: string;
  projectId: string;
  /** Turn-scoped Ask/Plan tool ∩ (signed ticket). */
  allowTicket?: string | null;
}): string {
  const origin = input.origin.replace(/\/+$/, "") || "http://127.0.0.1:3847";
  const base = `${origin}/api/mcp`;
  const id = input.projectId.trim();
  if (!id) return base;
  const q = new URLSearchParams();
  q.set("projectId", id);
  const ticket = input.allowTicket?.trim();
  if (ticket) q.set("allowTicket", ticket);
  return `${base}?${q.toString()}`;
}
