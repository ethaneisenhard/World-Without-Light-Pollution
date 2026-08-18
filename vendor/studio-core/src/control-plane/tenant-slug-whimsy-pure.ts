/**
 * Whimsical tenant slugs + stable UID suffix (Netlify/Vercel-style rename).
 * Infra Fly names use shortId — slug is the pretty hostname only.
 */

import { normalizeTenantSlug } from "./tenant-deployment-pure.js";
import { isReservedTenantSlug } from "./reserved-tenant-slugs-pure.js";

export {
  isReservedTenantSlug,
  PLATFORM_STUDIO_PRIMARY_SLUG,
  platformStudioPrimaryOrigin,
  RESERVED_TENANT_SLUG_STEMS,
} from "./reserved-tenant-slugs-pure.js";

/** Fun adjective × noun — keep lowercase a-z only (slug-safe). */
export const TENANT_SLUG_ADJECTIVES = [
  "amber",
  "bold",
  "bright",
  "cosmic",
  "crisp",
  "curious",
  "dappled",
  "ember",
  "feather",
  "fuzzy",
  "glowing",
  "golden",
  "happy",
  "ivory",
  "jazzy",
  "keen",
  "lively",
  "lucky",
  "misty",
  "neon",
  "nimble",
  "opal",
  "pepper",
  "plucky",
  "quick",
  "radiant",
  "rusty",
  "silver",
  "snappy",
  "soft",
  "spark",
  "sunny",
  "swift",
  "tidy",
  "velvet",
  "vivid",
  "witty",
  "zesty",
] as const;

export const TENANT_SLUG_NOUNS = [
  "badger",
  "beacon",
  "biscuit",
  "blossom",
  "breeze",
  "comet",
  "corgi",
  "crane",
  "ember",
  "falcon",
  "fern",
  "finch",
  "fox",
  "garden",
  "glider",
  "harbor",
  "heron",
  "kite",
  "lantern",
  "lotus",
  "maple",
  "meadow",
  "nebula",
  "otter",
  "paddle",
  "pebble",
  "phoenix",
  "pixel",
  "quail",
  "raven",
  "river",
  "rocket",
  "sparrow",
  "spruce",
  "starfish",
  "storm",
  "tiger",
  "walnut",
  "willow",
  "zephyr",
] as const;

/** FNV-1a 32-bit — deterministic whimsy from user id (no I/O). */
export function hashSeedToUint(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Stable 4-char suffix from tenant shortId / userId — clash insurance. */
export function tenantSlugUidSuffix(shortIdOrUserId: string): string {
  const clean = shortIdOrUserId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const body = clean.startsWith("user") ? clean.slice(4) : clean;
  const core = body.length >= 4 ? body : clean;
  return (core.slice(0, 4) || "x000").padEnd(4, "0");
}

export function normalizeTenantSlugStem(raw: string): string | null {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .slice(0, 32);
  if (!s || s.length < 2) return null;
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(s)) return null;
  if (isReservedTenantSlug(s)) return null;
  return s;
}

export function whimsicalStemFromSeed(seed: string): string {
  const h = hashSeedToUint(seed);
  const adj =
    TENANT_SLUG_ADJECTIVES[h % TENANT_SLUG_ADJECTIVES.length] ?? "cosmic";
  const noun =
    TENANT_SLUG_NOUNS[(h >>> 8) % TENANT_SLUG_NOUNS.length] ?? "otter";
  return `${adj}-${noun}`;
}

/** `{stem}-{uid}` — uid always present so renames stay unique. */
export function composeTenantSlug(stem: string, uidSuffix: string): string | null {
  const s = normalizeTenantSlugStem(stem);
  const uid = tenantSlugUidSuffix(uidSuffix);
  if (!s) return null;
  const full = normalizeTenantSlug(`${s}-${uid}`);
  return full;
}

export function whimsicalTenantSlug(input: {
  userId: string;
  /** Optional human stem; else whimsy from userId. */
  stemHint?: string;
}): string {
  const uid = tenantSlugUidSuffix(input.userId);
  const stem =
    (input.stemHint ? normalizeTenantSlugStem(input.stemHint) : null) ??
    whimsicalStemFromSeed(input.userId);
  return composeTenantSlug(stem, uid) ?? `studio-${uid}`;
}

/** Strip trailing `-{4}` uid when editing stem in UI (best-effort). */
export function stemFromTenantSlug(slug: string): string {
  const s = slug.trim().toLowerCase();
  const m = s.match(/^(.*)-([a-z0-9]{4})$/);
  if (m?.[1] && m[1].length >= 2) return m[1];
  return s;
}
