import {
  SESSION_COOKIE_NAME,
  VISITOR_COOKIE_MAX_AGE_SEC,
  VISITOR_COOKIE_NAME,
  mintSessionId,
  mintVisitorId,
} from "@glassbox-studio/identity";

export function normalizeAnalyticsIngestBody(body: {
  event_name?: unknown;
  name?: unknown;
  properties?: unknown;
  props?: unknown;
}): { name: string; props: Record<string, unknown> } | null {
  const name = body.event_name ?? body.name;
  if (typeof name !== "string" || !name) return null;
  const props =
    body.properties && typeof body.properties === "object" && !Array.isArray(body.properties)
      ? (body.properties as Record<string, unknown>)
      : body.props && typeof body.props === "object" && !Array.isArray(body.props)
        ? (body.props as Record<string, unknown>)
        : {};
  return { name, props };
}

function parseCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

export function resolveVisitorSessionFromRequest(request: Request): {
  visitorId: string;
  sessionId: string;
  setCookies: string[];
} {
  const cookie = request.headers.get("cookie") ?? undefined;
  const setCookies: string[] = [];
  let visitorId = parseCookie(cookie, VISITOR_COOKIE_NAME);
  let sessionId = parseCookie(cookie, SESSION_COOKIE_NAME);
  if (!visitorId) {
    visitorId = mintVisitorId();
    setCookies.push(
      `${VISITOR_COOKIE_NAME}=${encodeURIComponent(visitorId)}; Path=/; Max-Age=${VISITOR_COOKIE_MAX_AGE_SEC}; SameSite=Lax`,
    );
  }
  if (!sessionId) {
    sessionId = mintSessionId();
    setCookies.push(
      `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}; Path=/; Max-Age=1800; SameSite=Lax`,
    );
  }
  return { visitorId, sessionId, setCookies };
}
