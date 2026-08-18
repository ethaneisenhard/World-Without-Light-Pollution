/**
 * Rewrite loopback Live/preview URLs when Studio UI is opened from another device
 * (phone via Tailscale). Phone's 127.0.0.1 ≠ laptop's Dev server.
 *
 * Also: on loopback Studio, prefer `localhost` over `127.0.0.1` for Live iframes.
 * Many Next.js apps (HMR, assets, cookies) break or feel dead on 127 while
 * localhost works — Studio used to force 127 everywhere.
 */

export function isLoopbackHostname(hostname: string): boolean {
  const h = hostname.trim().toLowerCase().replace(/^\[|\]$/g, "");
  return h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "0.0.0.0";
}

/** Canonical loopback label for Live iframes when Studio itself is on loopback. */
export function preferredLoopbackHostname(pageHostname: string): string {
  const h = pageHostname.trim().toLowerCase().replace(/^\[|\]$/g, "");
  if (!isLoopbackHostname(h)) return h;
  // Prefer localhost — Next / webpack-hmr / cookies behave better than 127.0.0.1.
  return "localhost";
}

/**
 * When Studio is on loopback, rewrite 127.0.0.1 / ::1 Live bases to `localhost`
 * (same port/path). No-op for remote page hosts (use rewriteLoopbackUrlForRemoteClient).
 */
export function preferLocalhostLoopbackUrl(
  targetUrl: string,
  pageHostname: string,
): string {
  const raw = targetUrl.trim();
  if (!raw) return raw;
  if (!isLoopbackHostname(pageHostname)) return raw;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return raw;
  }
  if (!isLoopbackHostname(url.hostname)) return raw;

  const want = preferredLoopbackHostname(pageHostname);
  if (url.hostname === want) return raw;
  url.hostname = want;
  return url.toString();
}

/** Local Studio UI port (`pnpm dev` / wrangler). Tailscale Serve maps this to HTTPS :443. */
export const DEFAULT_STUDIO_SHELL_PORT = "4400";

export type RemoteClientPage = {
  /** `window.location.hostname` */
  hostname: string;
  /** `window.location.protocol` e.g. `https:` */
  protocol: string;
  /**
   * Optional MagicDNS / Tailscale IP when the page host is Tailscale Serve
   * (HTTPS → :4400 only) and Dev servers must use the machine name instead.
   */
  previewHostname?: string;
  /**
   * `window.location.port` (empty when default 443/80). Used so shell-port
   * targets can stay on `:4400` only when the page itself is on `:4400`.
   */
  port?: string;
  /** Override shell port (tests / `AS_STUDIO_PORT`). Default `4400`. */
  studioShellPort?: string;
};

/**
 * Tailscale `serve 4400` publishes Studio on default HTTPS (:443), not TCP :4400.
 * Keep `:4400` only when the phone already opened Studio on that explicit port
 * (optional `--https=4400` Serve). Live Dev ports (8789, 9889, …) keep their port.
 */
export function remoteHttpsPortForLoopbackTarget(
  targetPort: string,
  page: Pick<RemoteClientPage, "port" | "studioShellPort">,
): string {
  const shell = (page.studioShellPort ?? DEFAULT_STUDIO_SHELL_PORT).trim() || DEFAULT_STUDIO_SHELL_PORT;
  const target = targetPort.trim();
  if (target !== shell) return target;
  const pagePort = page.port?.trim() ?? "";
  if (pagePort === shell) return shell;
  // Page on :443 / :80 / empty → Serve default HTTPS (omit port).
  return "";
}

/**
 * If `targetUrl` points at loopback and the page is remote, swap host to the
 * client's reachable Host hostname. Keeps the Dev server port (except Studio
 * shell → default HTTPS when Serve did not publish TCP :4400).
 *
 * Always uses `https:` for remote clients — Tailscale Serve publishes Live
 * ports with `--https=<port>` so HTTPS Studio iframes are not mixed-content
 * blocked. (HTTP Studio can still embed an HTTPS Live iframe.)
 */
export function rewriteLoopbackUrlForRemoteClient(
  targetUrl: string,
  page: RemoteClientPage,
): string {
  const raw = targetUrl.trim();
  if (!raw) return raw;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return raw;
  }

  if (!isLoopbackHostname(url.hostname)) return raw;

  const pageIsLoopback = isLoopbackHostname(page.hostname);
  const override = page.previewHostname?.trim();
  if (pageIsLoopback && !override) return raw;

  const host = override || page.hostname;
  if (!host || isLoopbackHostname(host)) return raw;

  const priorPort =
    url.port ||
    (url.protocol === "https:" ? "443" : url.protocol === "http:" ? "80" : "");
  url.protocol = "https:";
  url.hostname = host;
  url.port = remoteHttpsPortForLoopbackTarget(priorPort, page);
  return url.toString();
}

/** Remote rewrite, then localhost preference for loopback Studio. */
export function rewriteLivePreviewBaseUrl(
  targetUrl: string,
  page: RemoteClientPage,
): string {
  const remote = rewriteLoopbackUrlForRemoteClient(targetUrl, page);
  return preferLocalhostLoopbackUrl(remote, page.hostname);
}
