/**
 * Attach existing Fly apps to a dogfood deployment (no provision yet).
 */

import type { LegacyResourceRef } from "./tenant-deployment-pure.js";

/** Personal-org Fly inventory (2026-07 audit) — dogfood backbone. */
export const LEGACY_FLY_SIDECAR_URLS: Readonly<
  Record<string, { url: string; flyApp: string }>
> = {
  host: {
    url: "https://glassbox-studio-host.fly.dev",
    flyApp: "glassbox-studio-host",
  },
  n8n: {
    url: "https://browserui-n8n.fly.dev",
    flyApp: "browserui-n8n",
  },
  "mpg-proxy": {
    url: "https://browserui-mpg-proxy.fly.dev",
    flyApp: "browserui-mpg-proxy",
  },
  haraka: {
    url: "https://browserui-haraka.fly.dev",
    flyApp: "browserui-haraka",
  },
  zulip: {
    url: "https://browserui-zulip.fly.dev",
    flyApp: "browserui-zulip",
  },
  "zulip-db": {
    url: "https://browserui-zulip-db.fly.dev",
    flyApp: "browserui-zulip-db",
  },
  clickhouse: {
    url: "https://browserui-clickhouse.fly.dev",
    flyApp: "browserui-clickhouse",
  },
  "bun-fly": {
    url: "https://browserui-bun-fly.fly.dev",
    flyApp: "browserui-bun-fly",
  },
  worker: {
    url: "https://glassbox-studio.devbyethan.workers.dev",
    flyApp: "glassbox-studio",
  },
  /** Empty Fly app created 2026-07-21 — control-plane provision proof. */
  probe: {
    url: "https://bu-tenantdo-probe.fly.dev",
    flyApp: "bu-tenantdo-probe",
  },
};

export function legacyResourcesForSidecars(
  sidecarIds: readonly string[],
): LegacyResourceRef[] {
  const out: LegacyResourceRef[] = [];
  for (const id of sidecarIds) {
    const hit = LEGACY_FLY_SIDECAR_URLS[id];
    if (!hit) continue;
    out.push({ sidecarId: id, url: hit.url, flyApp: hit.flyApp });
  }
  return out;
}
