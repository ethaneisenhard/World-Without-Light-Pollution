/**
 * Extract publishable loopback TCP port from a Dev runtime URL.
 * Shared by Tailscale Serve + cloud-desk Caddy publish.
 */

import { isLoopbackHostname } from "./host-preview-url-pure.js";

export type PreviewPortSource = {
  url?: string | null;
  port?: number | null;
};

export function isPublishableTcpPort(port: number): boolean {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

export function portFromServeSource(source: PreviewPortSource): number | null {
  if (source.port != null) {
    const n = Number(source.port);
    if (isPublishableTcpPort(n)) return n;
  }
  const raw = typeof source.url === "string" ? source.url.trim() : "";
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (!isLoopbackHostname(url.hostname)) return null;
  if (url.port) {
    const n = Number(url.port);
    return isPublishableTcpPort(n) ? n : null;
  }
  return null;
}
