/**
 * Public `gateway.{slug}` edge — which paths may exist on the internet.
 * Chat `/v1` is Host-private (loopback / Fly 6PN). Never proxy it on this vhost.
 */

export type GatewayEdgePathKind = "api" | "ui";

/** First path segment → locked OpenAI-compat / admin API. */
const GATEWAY_EDGE_API_SEGMENTS = new Set([
  "v1",
  "openai",
  "key",
  "user",
  "team",
  "spend",
  "credentials",
  "config",
  "global",
  "health",
  "metrics",
  "models",
  "chat",
  "completions",
  "embeddings",
  "routes.json",
  "graphql",
]);

function firstPathSegment(pathname: string): string {
  const raw = pathname.trim().split("?")[0] ?? "";
  const parts = raw.split("/").filter(Boolean);
  return (parts[0] ?? "").toLowerCase();
}

/** `api` = 404 on public vanity. `ui` = Admin UI (edge basic-auth). */
export function gatewayEdgePathKind(pathname: string): GatewayEdgePathKind {
  const seg = firstPathSegment(pathname);
  if (!seg) return "ui";
  if (GATEWAY_EDGE_API_SEGMENTS.has(seg)) return "api";
  return "ui";
}

export function isPublicGatewayApiPath(pathname: string): boolean {
  return gatewayEdgePathKind(pathname) === "api";
}
