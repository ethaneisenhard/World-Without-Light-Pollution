/**
 * Chat API URLs for Studio UI.
 *
 * Always same-origin `/api/...` — Worker injects `AS_HOST_TOKEN` and checks
 * `__session`. Never bypass to `:3847` from the browser: Host token auth would
 * 401 and look like a logout (cookie on :4400 ≠ Host Bearer).
 *
 * Long SSE vs wrangler reload: keep the Worker proxy; do not open a second
 * auth plane to loopback Host.
 */

export type StudioLocationLike = {
  protocol: string;
  hostname: string;
  port: string;
};

export type ChatApiUrlOpts = {
  location?: StudioLocationLike | null;
  /** @deprecated Ignored — chat stays same-origin for session + Host token. */
  apiProxyOrigin?: string | null;
};

/**
 * Always null — same-origin Worker proxy.
 * Kept so call sites / tests that pass apiProxyOrigin still typecheck.
 */
export function resolveStudioDevApiBase(
  _location: StudioLocationLike,
  _apiProxyOrigin?: string | null,
): string | null {
  return null;
}

function withDevApiBase(path: string, _opts?: ChatApiUrlOpts | null): string {
  return path;
}

function normalizeOpts(
  locationOrOpts?: StudioLocationLike | ChatApiUrlOpts | null,
  apiProxyOrigin?: string | null,
): ChatApiUrlOpts {
  if (!locationOrOpts) {
    return { location: null, apiProxyOrigin: apiProxyOrigin ?? null };
  }
  if ("protocol" in locationOrOpts && "hostname" in locationOrOpts) {
    return {
      location: locationOrOpts,
      apiProxyOrigin: apiProxyOrigin ?? null,
    };
  }
  return {
    location: locationOrOpts.location ?? null,
    apiProxyOrigin: locationOrOpts.apiProxyOrigin ?? apiProxyOrigin ?? null,
  };
}

export function resolveChatPostUrl(
  projectId: string,
  locationOrOpts?: StudioLocationLike | ChatApiUrlOpts | null,
  apiProxyOrigin?: string | null,
): string {
  return withDevApiBase(
    `/api/projects/${encodeURIComponent(projectId)}/chat`,
    normalizeOpts(locationOrOpts, apiProxyOrigin),
  );
}

export function resolveChatTurnEventsUrl(
  projectId: string,
  turnId: string,
  locationOrOpts?: StudioLocationLike | ChatApiUrlOpts | null,
  fromSeq = 0,
  apiProxyOrigin?: string | null,
): string {
  const q =
    fromSeq > 0 ? `?fromSeq=${encodeURIComponent(String(fromSeq))}` : "";
  return withDevApiBase(
    `/api/projects/${encodeURIComponent(projectId)}/chat/turns/${encodeURIComponent(turnId)}/events${q}`,
    normalizeOpts(locationOrOpts, apiProxyOrigin),
  );
}

export function resolveChatTurnCancelUrl(
  projectId: string,
  turnId: string,
  locationOrOpts?: StudioLocationLike | ChatApiUrlOpts | null,
  apiProxyOrigin?: string | null,
): string {
  return withDevApiBase(
    `/api/projects/${encodeURIComponent(projectId)}/chat/turns/${encodeURIComponent(turnId)}/cancel`,
    normalizeOpts(locationOrOpts, apiProxyOrigin),
  );
}

export function resolveChatActiveTurnUrl(
  projectId: string,
  sessionId: string,
  locationOrOpts?: StudioLocationLike | ChatApiUrlOpts | null,
  apiProxyOrigin?: string | null,
): string {
  const q = `?sessionId=${encodeURIComponent(sessionId)}`;
  return withDevApiBase(
    `/api/projects/${encodeURIComponent(projectId)}/chat/turns/active${q}`,
    normalizeOpts(locationOrOpts, apiProxyOrigin),
  );
}
