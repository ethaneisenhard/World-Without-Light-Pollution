/**
 * Topbar Preview menu — outbound links (Studio / Tailnet / Site / services / API).
 * Studio services come from `STUDIO_SERVICE_DEFS` — add a def, not a parallel URL prop.
 */

import { FALLBACK_REMOTE_STUDIO_URL } from "./host-remote-pure.js";
import {
  STUDIO_SERVICE_DEFS,
  listStudioServiceIds,
  type StudioRailServiceId,
} from "./studio-service-registry-pure.js";

export type PreviewLinkId =
  | "studio"
  | "site"
  | "api"
  | "phone"
  | StudioRailServiceId;

export type PreviewLink = {
  id: PreviewLinkId;
  label: string;
  href: string;
  external: boolean;
};

export type ProjectPreviewLinksInput = {
  studioOrigin?: string | null;
  siteUrl?: string | null;
  /** Per-service Preview URLs (overrides defaults when provided). */
  serviceUrls?: Partial<Record<StudioRailServiceId, string | null>>;
  apiUrl?: string | null;
  /** Tailscale Serve HTTPS Studio URL for phone access. */
  remoteStudioUrl?: string | null;
};

/** Preview Tailnet fallback — same seam as `FALLBACK_REMOTE_STUDIO_URL` /
 * `resolveDefaultRemoteStudioUrl` (env `AS_REMOTE_STUDIO_URL`). */
export const DEFAULT_REMOTE_STUDIO_URL = FALLBACK_REMOTE_STUDIO_URL;

function trimUrl(v: string | null | undefined): string {
  return typeof v === "string" ? v.trim() : "";
}

function resolveServiceUrl(
  id: StudioRailServiceId,
  input: ProjectPreviewLinksInput,
): string {
  return trimUrl(input.serviceUrls?.[id]);
}

/** Stable ordered list of non-empty preview destinations. */
export function projectPreviewLinks(
  input: ProjectPreviewLinksInput,
): PreviewLink[] {
  const links: PreviewLink[] = [];
  const studio = trimUrl(input.studioOrigin);
  if (studio) {
    links.push({
      id: "studio",
      label: "Studio",
      href: studio,
      external: false,
    });
  }
  // Always show Tailnet — live remote URL wins; else hard-coded Serve URL.
  const phone =
    trimUrl(input.remoteStudioUrl) || DEFAULT_REMOTE_STUDIO_URL;
  links.push({
    id: "phone",
    label: "Tailnet",
    href: phone,
    external: true,
  });
  const site = trimUrl(input.siteUrl);
  if (site) {
    links.push({
      id: "site",
      label: "Site",
      href: site,
      external: true,
    });
  }
  for (const id of listStudioServiceIds()) {
    const def = STUDIO_SERVICE_DEFS[id];
    if (!def.preview) continue;
    const href = resolveServiceUrl(id, input);
    if (!href) continue;
    links.push({
      id,
      label: def.label,
      href,
      external: true,
    });
  }
  const api = trimUrl(input.apiUrl);
  if (api) {
    links.push({
      id: "api",
      label: "API",
      href: api,
      external: true,
    });
  }
  return links;
}

export function previewMenuLabel(links: readonly PreviewLink[]): string {
  const site = links.find((l) => l.id === "site");
  if (site) {
    try {
      return new URL(site.href).host;
    } catch {
      return "Preview";
    }
  }
  // Stable chrome label — never fall through to n8n/api (SSR↔client order differs).
  return "Preview";
}
