/**
 * STUDIO rail Open — Cloud Host on loopback Studio hops to hosted shell / sidecars.
 * Local Host stays on this origin (in-app windows, loopback service UIs).
 */

import { DEFAULT_API_SITE_BASE_DOMAIN, parsePlatformApiSlug } from "./control-plane/api-hostname-pure.js";
import { platformStudioPrimaryOrigin } from "./control-plane/reserved-tenant-slugs-pure.js";
import { platformStudioUrl } from "./control-plane/tenant-hostname-pure.js";
import {
  isStudioLocalHostAttach,
  isStudioServiceLoopbackUrl,
  resolveStudioServiceOpenUrl,
} from "./studio-service-registry-pure.js";
import {
  resolveStudioRailItem,
  type StudioRailItemId,
  type StudioRailWindowId,
} from "./studio-rail-pure.js";

export type StudioRailOpenExternal = {
  mode: "external";
  href: string;
};

export type StudioRailOpenInApp = {
  mode: "in-app";
  window: StudioRailWindowId;
};

export type StudioRailOpenResult = StudioRailOpenExternal | StudioRailOpenInApp;

function trimOrigin(raw: string | null | undefined): string {
  return typeof raw === "string" ? raw.trim().replace(/\/+$/, "") : "";
}

/** Host API proxy (`api.{slug}.…`) → Studio shell (`https://{slug}.…`). */
export function cloudStudioOriginFromHostProxy(
  proxy: string | null | undefined,
): string {
  const slug = proxy?.trim() ? parsePlatformApiSlug(proxy) : null;
  if (slug) {
    const url = platformStudioUrl(slug, DEFAULT_API_SITE_BASE_DOMAIN);
    if (url) return url.replace(/\/+$/, "");
  }
  return platformStudioPrimaryOrigin(DEFAULT_API_SITE_BASE_DOMAIN).replace(
    /\/+$/,
    "",
  );
}

export function studioRailWindowCloudHref(input: {
  origin: string;
  windowId: StudioRailWindowId;
}): string {
  const origin = trimOrigin(input.origin) || cloudStudioOriginFromHostProxy(null);
  const p = new URLSearchParams();
  p.set(input.windowId, "1");
  p.set("focus", input.windowId);
  if (input.windowId === "chat") p.set("tab", "ai");
  return `${origin}/?${p.toString()}`;
}

/** Preview "Studio" row — Cloud + loopback page → hosted shell. */
export function resolvePreviewStudioOrigin(input: {
  hostId?: string | null;
  pageOrigin?: string | null;
  cloudStudioOrigin?: string | null;
}): string {
  const page = trimOrigin(input.pageOrigin);
  const cloud = trimOrigin(input.cloudStudioOrigin) || cloudStudioOriginFromHostProxy(null);
  if (!isStudioLocalHostAttach(input.hostId) && isStudioServiceLoopbackUrl(page)) {
    return cloud;
  }
  return page || cloud;
}

/**
 * Rail click target. Cloud Host + local `:4400` → hosted Home / sidecars.
 * Already on a hosted shell, or Local Host → in-app windows.
 */
export function resolveStudioRailOpen(input: {
  itemId: StudioRailItemId;
  hostId?: string | null;
  liveUrl?: string | null;
  pageOrigin?: string | null;
  cloudStudioOrigin?: string | null;
}): StudioRailOpenResult | null {
  const item = resolveStudioRailItem(input.itemId);
  if (!item) return null;

  switch (item.kind) {
    case "service": {
      const href = resolveStudioServiceOpenUrl({
        serviceId: item.serviceId,
        liveUrl: input.liveUrl,
        hostId: input.hostId,
      });
      return href ? { mode: "external", href } : null;
    }
    case "window": {
      const page = trimOrigin(input.pageOrigin);
      const cloud =
        trimOrigin(input.cloudStudioOrigin) ||
        cloudStudioOriginFromHostProxy(null);
      if (
        !isStudioLocalHostAttach(input.hostId) &&
        isStudioServiceLoopbackUrl(page)
      ) {
        return {
          mode: "external",
          href: studioRailWindowCloudHref({
            origin: cloud,
            windowId: item.window,
          }),
        };
      }
      return { mode: "in-app", window: item.window };
    }
    default: {
      const _exhaustive: never = item;
      return _exhaustive;
    }
  }
}
