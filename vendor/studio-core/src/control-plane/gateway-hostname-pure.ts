/**
 * Per-tenant LiteLLM gateway public hostnames.
 *
 * Rule: Studio shell `{slug}.glassboxcomputer.site`
 *     → gateway `gateway.{slug}.glassboxcomputer.site`
 *
 * Primary dogfood shell is `auth.…site` → `gateway.auth.…site`
 * (not one-label `gateway.…site`, which is reserved / Worker-claimed).
 *
 * Twin of {@link ./workflows-hostname-pure.js} and {@link ./api-hostname-pure.js}.
 * Harness `litellm` only — peers stay off this gateway.
 */

import { DEFAULT_LITELLM_BASE_URL } from "../chat-completions-provider-pure.js";
import { parsePlatformApiSlug } from "./api-hostname-pure.js";
import {
  isReservedTenantSlug,
  PLATFORM_STUDIO_PRIMARY_SLUG,
} from "./reserved-tenant-slugs-pure.js";
import { normalizeTenantSlug } from "./tenant-deployment-pure.js";
import {
  normalizeStudioSiteBaseDomain,
  parseNestedPlatformServiceSlug,
  parsePlatformStudioSlug,
} from "./tenant-hostname-pure.js";

/** Live Studio site zone for nested LiteLLM gateway hosts. */
export const DEFAULT_GATEWAY_SITE_BASE_DOMAIN = "glassboxcomputer.site";

/**
 * `gateway.{slug}.{base}` — nested under site zone so one-label Studio
 * Worker route (`gateway.…`) does not claim it.
 */
export function platformGatewayHostname(
  slug: string,
  baseDomain: string = DEFAULT_GATEWAY_SITE_BASE_DOMAIN,
): string | null {
  const s = normalizeTenantSlug(slug);
  if (!s) return null;
  const base = normalizeStudioSiteBaseDomain(baseDomain);
  return `gateway.${s}.${base}`;
}

export function platformGatewayUrl(
  slug: string,
  baseDomain: string = DEFAULT_GATEWAY_SITE_BASE_DOMAIN,
): string | null {
  const host = platformGatewayHostname(slug, baseDomain);
  return host ? `https://${host}` : null;
}

/** OpenAI-compat API origin (`…/v1`) for Host `LITELLM_BASE_URL`. */
export function platformGatewayV1Url(
  slug: string,
  baseDomain: string = DEFAULT_GATEWAY_SITE_BASE_DOMAIN,
): string | null {
  const origin = platformGatewayUrl(slug, baseDomain);
  return origin ? `${origin}/v1` : null;
}

/** Admin UI path on the same origin. */
export function platformGatewayUiUrl(
  slug: string,
  baseDomain: string = DEFAULT_GATEWAY_SITE_BASE_DOMAIN,
): string | null {
  const origin = platformGatewayUrl(slug, baseDomain);
  return origin ? `${origin}/ui` : null;
}

/** Primary Studio shell (`auth.…site`) → `https://gateway.auth.…site`. */
export const PLATFORM_PRIMARY_GATEWAY_URL =
  platformGatewayUrl(
    PLATFORM_STUDIO_PRIMARY_SLUG,
    DEFAULT_GATEWAY_SITE_BASE_DOMAIN,
  ) ??
  `https://gateway.${PLATFORM_STUDIO_PRIMARY_SLUG}.${DEFAULT_GATEWAY_SITE_BASE_DOMAIN}`;

export const PLATFORM_PRIMARY_GATEWAY_V1_URL = `${PLATFORM_PRIMARY_GATEWAY_URL}/v1`;
export const PLATFORM_PRIMARY_GATEWAY_UI_URL = `${PLATFORM_PRIMARY_GATEWAY_URL}/ui`;

/**
 * Derive LiteLLM vanity URL from the Studio shell hostname.
 * `auth.glassboxcomputer.site` → `https://gateway.auth.glassboxcomputer.site`
 * `acme.glassboxcomputer.site` → `https://gateway.acme.glassboxcomputer.site`
 */
export function platformGatewayUrlFromStudioHostname(
  studioHost: string,
  baseDomain: string = DEFAULT_GATEWAY_SITE_BASE_DOMAIN,
): string | null {
  const host = studioHost.trim().toLowerCase().split(":")[0] ?? "";
  if (!host) return null;
  const slug = parsePlatformStudioSlug(host, baseDomain);
  if (!slug) return null;
  if (
    isReservedTenantSlug(slug) &&
    slug !== PLATFORM_STUDIO_PRIMARY_SLUG
  ) {
    return null;
  }
  return platformGatewayUrl(slug, baseDomain);
}

/**
 * Cloudflare DNS record name relative to the zone apex
 * (`gateway.{slug}` → A/CNAME target).
 */
export function platformGatewayDnsRecordName(slug: string): string | null {
  const s = normalizeTenantSlug(slug);
  if (!s) return null;
  return `gateway.${s}`;
}

/**
 * `gateway.{slug}.{base}` → tenant slug.
 * `https://gateway.acme.glassboxcomputer.site/v1` → `acme`.
 */
export function parsePlatformGatewaySlug(
  hostOrUrl: string,
  baseDomain: string = DEFAULT_GATEWAY_SITE_BASE_DOMAIN,
): string | null {
  const raw = hostOrUrl.trim();
  if (!raw) return null;
  let host = raw.toLowerCase().split(":")[0] ?? "";
  try {
    if (raw.includes("://")) host = new URL(raw).hostname;
  } catch {
    return null;
  }
  return parseNestedPlatformServiceSlug(host, "gateway", baseDomain);
}

export function isLoopbackLitellmUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    switch (u.hostname) {
      case "127.0.0.1":
      case "localhost":
      case "::1":
        return true;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

/** Fly 6PN / Flycast — Host→gateway on the private net, not public HTTPS. */
export function litellmPrivateV1UrlFromFlyApp(flyApp: string): string | null {
  const app = flyApp.trim().toLowerCase();
  if (!app || !/^[a-z0-9-]+$/.test(app)) return null;
  return `http://${app}.internal:4000/v1`;
}

export function isFlyInternalLitellmUrl(
  url: string,
  flyApp?: string | null,
): boolean {
  try {
    const host = new URL(url.trim()).hostname.toLowerCase();
    const isInternal =
      host.endsWith(".internal") || host.endsWith(".flycast");
    if (!isInternal) return false;
    const app = flyApp?.trim().toLowerCase();
    if (!app) return true;
    return host === `${app}.internal` || host === `${app}.flycast`;
  } catch {
    return false;
  }
}

/** Loopback or Fly private — never the public `gateway.{slug}` API. */
export function isPrivateLitellmUrl(
  url: string,
  flyApp?: string | null,
): boolean {
  return isLoopbackLitellmUrl(url) || isFlyInternalLitellmUrl(url, flyApp);
}

/** True when URL hostname is this tenant's `gateway.{slug}` vanity. */
export function gatewayUrlBelongsToTenant(
  resourceUrl: string,
  tenantSlug: string,
  baseDomain: string = DEFAULT_GATEWAY_SITE_BASE_DOMAIN,
): boolean {
  const expected = platformGatewayHostname(tenantSlug, baseDomain);
  if (!expected) return false;
  try {
    const host = new URL(resourceUrl.trim()).hostname.toLowerCase();
    return host === expected;
  } catch {
    return false;
  }
}

/** Host API origin allowed for this tenant (private preferred; vanity UI origin ok). */
export function litellmApiUrlAllowedForTenant(input: {
  url: string;
  tenantSlug: string;
  flyApp?: string | null;
  baseDomain?: string;
}): boolean {
  if (isPrivateLitellmUrl(input.url, input.flyApp)) return true;
  return gatewayUrlBelongsToTenant(
    input.url,
    input.tenantSlug,
    input.baseDomain ?? DEFAULT_GATEWAY_SITE_BASE_DOMAIN,
  );
}

export type BindLitellmBaseUrlError = "cross_tenant" | "invalid_url";

export type BindLitellmBaseUrlResult =
  | { ok: true; baseUrl: string }
  | { ok: false; error: BindLitellmBaseUrlError };

/**
 * Host calls a **private** LiteLLM origin (loopback / Fly 6PN).
 * Public `gateway.{slug}` is UI + edge-auth only — not the chat API.
 * Never tenant A's Host → tenant B's gateway.
 */
export function boundLitellmBaseUrlForHost(input: {
  configuredBaseUrl?: string | null;
  hostPublicUrl?: string | null;
  siteBaseDomain?: string;
  litellmFlyApp?: string | null;
}): BindLitellmBaseUrlResult {
  const baseDomain =
    input.siteBaseDomain ?? DEFAULT_GATEWAY_SITE_BASE_DOMAIN;
  const tenantSlug = input.hostPublicUrl
    ? parsePlatformApiSlug(input.hostPublicUrl, baseDomain)
    : null;
  const configured = (input.configuredBaseUrl ?? "").trim();

  if (!tenantSlug) {
    if (!configured) {
      return { ok: true, baseUrl: DEFAULT_LITELLM_BASE_URL };
    }
    if (isPrivateLitellmUrl(configured, input.litellmFlyApp)) {
      const env = litellmHostEnvFromGatewayUrl(configured);
      return env
        ? { ok: true, baseUrl: env.LITELLM_BASE_URL }
        : { ok: false, error: "invalid_url" };
    }
    return { ok: false, error: "cross_tenant" };
  }

  if (!configured) {
    const internal = input.litellmFlyApp
      ? litellmPrivateV1UrlFromFlyApp(input.litellmFlyApp)
      : null;
    return { ok: true, baseUrl: internal ?? DEFAULT_LITELLM_BASE_URL };
  }
  if (!isPrivateLitellmUrl(configured, input.litellmFlyApp)) {
    return { ok: false, error: "cross_tenant" };
  }
  const env = litellmHostEnvFromGatewayUrl(configured);
  return env
    ? { ok: true, baseUrl: env.LITELLM_BASE_URL }
    : { ok: false, error: "invalid_url" };
}

export function litellmBindErrorMessage(error: BindLitellmBaseUrlError): string {
  switch (error) {
    case "cross_tenant":
      return "LiteLLM gateway URL is not this site's private gateway. Each site talks only to its own loopback or Fly 6PN origin.";
    case "invalid_url":
      return "LiteLLM gateway URL is invalid.";
    default: {
      const _x: never = error;
      return _x;
    }
  }
}

/** Host env patch after gateway vanity URL is known. */
export function litellmHostEnvFromGatewayUrl(
  resourceUrl: string,
  apiKey?: string,
): { LITELLM_BASE_URL: string; LITELLM_API_KEY?: string } | null {
  const raw = resourceUrl.trim().replace(/\/+$/, "");
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    const origin = u.origin;
    const base = `${origin}/v1`;
    const key = apiKey?.trim();
    return key
      ? { LITELLM_BASE_URL: base, LITELLM_API_KEY: key }
      : { LITELLM_BASE_URL: base };
  } catch {
    return null;
  }
}
