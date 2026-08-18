import {
  normalizeAnalyticsIngestBody,
  resolveVisitorSessionFromRequest,
} from "./events-pure.js";

export type MemoryEvent = {
  id: string;
  name: string;
  props: Record<string, unknown>;
  createdAt: number;
};

const globalKey = "__AS_STARTER_ANALYTICS_EVENTS__";

function store(): MemoryEvent[] {
  const g = globalThis as Record<string, unknown>;
  if (!Array.isArray(g[globalKey])) g[globalKey] = [];
  return g[globalKey] as MemoryEvent[];
}

/** Handle /api/events and /api/identity/visitor for the starter Worker. */
export async function tryHandleStarterAnalytics(
  request: Request,
  url: URL,
): Promise<Response | null> {
  if (url.pathname === "/api/identity/visitor" && request.method === "GET") {
    const ids = resolveVisitorSessionFromRequest(request);
    const headers = new Headers({ "content-type": "application/json" });
    for (const c of ids.setCookies) headers.append("set-cookie", c);
    return new Response(
      JSON.stringify({ visitorId: ids.visitorId, sessionId: ids.sessionId }),
      { status: 200, headers },
    );
  }

  if (url.pathname === "/api/events" && request.method === "POST") {
    const body = (await request.json()) as Record<string, unknown>;
    const normalized = normalizeAnalyticsIngestBody(body);
    if (!normalized) {
      return Response.json({ error: "event_name or name required" }, { status: 400 });
    }
    const event: MemoryEvent = {
      id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: normalized.name,
      props: normalized.props,
      createdAt: Date.now(),
    };
    store().push(event);
    return Response.json({ ok: true, event });
  }

  if (url.pathname === "/api/events" && request.method === "GET") {
    return Response.json({ events: [...store()].reverse().slice(0, 200) });
  }

  return null;
}
