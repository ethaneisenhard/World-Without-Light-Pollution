/**
 * Project-owned Live reload protocols.
 *
 * IDE model (preferred): Studio writes disk only. Project Vite watches content →
 * regenerate → `full-reload` → iframe refreshes (`vite-full-reload/1`).
 *
 * Legacy `as-hmr/1`: Studio postMessage path+content into a draft bridge.
 */

export const AS_HMR_PROTOCOL = "as-hmr/1" as const;
export const VITE_FULL_RELOAD_PROTOCOL = "vite-full-reload/1" as const;

export const AS_HMR_UPDATE = "as:hmr-update" as const;
export const AS_HMR_UPDATED = "as:hmr-updated" as const;
export const AS_HMR_INVALIDATE = "as:hmr-invalidate" as const;

export type AsHmrProtocol = typeof AS_HMR_PROTOCOL;
export type ViteFullReloadProtocol = typeof VITE_FULL_RELOAD_PROTOCOL;

export type AsHmrUpdateMessage = {
  type: typeof AS_HMR_UPDATE;
  path: string;
  content: string;
};

export type AsHmrInvalidateMessage = {
  type: typeof AS_HMR_INVALIDATE;
  /** Omit to invalidate all. */
  path?: string;
};

/** Optional; Studio ignores. Bridge may emit for debugging. */
export type AsHmrUpdatedMessage = {
  type: typeof AS_HMR_UPDATED;
  ok: boolean;
};

export type ProjectHmrConfig = {
  /** Script path on project origin, e.g. `/as-hmr-bridge.js`. */
  bridge: string;
  protocol: AsHmrProtocol | ViteFullReloadProtocol;
  /** Vite `@vite/client` URL for `vite-full-reload/1`. */
  viteClient?: string;
};

export function hmrUpdateMessage(
  path: string,
  content: string,
): AsHmrUpdateMessage {
  return { type: AS_HMR_UPDATE, path, content };
}

export function hmrInvalidateMessage(
  path?: string,
): AsHmrInvalidateMessage {
  return path
    ? { type: AS_HMR_INVALIDATE, path }
    : { type: AS_HMR_INVALIDATE };
}

export function isHmrUpdatedMessage(
  data: unknown,
): data is AsHmrUpdatedMessage {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return d.type === AS_HMR_UPDATED && typeof d.ok === "boolean";
}

/** Preview still needs a notify for current draft (legacy as-hmr/1). */
export function hmrNeedsNotify(
  content: string,
  notifiedContent: string | null,
): boolean {
  return content !== notifiedContent;
}

/** Legacy: Studio pushes draft content into the project bridge. */
export function isAsHmrV1(
  hmr: { protocol?: string; bridge?: string } | null | undefined,
): hmr is ProjectHmrConfig {
  return (
    !!hmr &&
    typeof hmr.bridge === "string" &&
    hmr.bridge.length > 0 &&
    hmr.protocol === AS_HMR_PROTOCOL
  );
}

/** IDE path: Studio writes disk; project Vite full-reloads the iframe. */
export function isViteFullReloadHmr(
  hmr: { protocol?: string; bridge?: string } | null | undefined,
): hmr is ProjectHmrConfig {
  return (
    !!hmr &&
    typeof hmr.bridge === "string" &&
    hmr.bridge.length > 0 &&
    hmr.protocol === VITE_FULL_RELOAD_PROTOCOL
  );
}

/** Any project-owned Live HMR (draft push or Vite reload). */
export function isProjectLiveHmr(
  hmr: { protocol?: string; bridge?: string } | null | undefined,
): boolean {
  return isAsHmrV1(hmr) || isViteFullReloadHmr(hmr);
}
