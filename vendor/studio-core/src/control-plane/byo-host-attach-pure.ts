/**
 * BYO-Host edge attach — register customer-operated Host URL (no Fly create).
 * ADR 0014: customer owns Host; edge is shell convenience.
 */

export type ParseByoHostUrlResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/** Normalize and validate a public Host API base URL (https preferred). */
export function parseByoHostUrl(raw: unknown): ParseByoHostUrlResult {
  if (typeof raw !== "string" || !raw.trim()) {
    return { ok: false, error: "host_url_required" };
  }
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return { ok: false, error: "host_url_invalid" };
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") {
    return { ok: false, error: "host_url_protocol" };
  }
  // Disallow path noise — Host API is origin (+ optional port)
  if (u.username || u.password) {
    return { ok: false, error: "host_url_credentials_forbidden" };
  }
  const path = u.pathname.replace(/\/$/, "");
  if (path && path !== "") {
    return { ok: false, error: "host_url_must_be_origin" };
  }
  return { ok: true, url: u.origin };
}

export function byoHostHealthUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/health`;
}

/**
 * Accept Host /health JSON when it looks like a Studio Host
 * (`host: true` or service/status markers).
 */
export function isStudioHostHealthBody(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const o = body as Record<string, unknown>;
  if (o.host === true) return true;
  if (o.ok === true && (o.service === "studio" || o.service === "studio-host")) {
    return true;
  }
  if (typeof o.status === "string" && /ok|ready|up/i.test(o.status)) {
    return true;
  }
  return false;
}
