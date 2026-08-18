/**
 * Fun public tenant slugs for `{slug}.browserui.site`.
 * Always ends with a short UID so collisions stay rare.
 */

import { normalizeTenantSlug } from "./tenant-deployment-pure.js";

/** Soft / craft / studio-adjacent — avoid generic tech / purple-AI vibes. */
export const TENANT_SLUG_ADJECTIVES = [
  "amber",
  "briny",
  "cedar",
  "coral",
  "cosmic",
  "dusty",
  "ember",
  "fern",
  "foggy",
  "golden",
  "honey",
  "ivory",
  "jade",
  "kiln",
  "lemon",
  "lunar",
  "maple",
  "misty",
  "mossy",
  "neon",
  "olive",
  "opal",
  "peach",
  "pine",
  "plaid",
  "plum",
  "rusty",
  "sandy",
  "satin",
  "silky",
  "sunny",
  "tidal",
  "velvet",
  "violet",
  "wavy",
  "wooly",
] as const;

export const TENANT_SLUG_NOUNS = [
  "anvil",
  "atlas",
  "beacon",
  "biscuit",
  "brook",
  "canvas",
  "comet",
  "compass",
  "cove",
  "crane",
  "drift",
  "ember",
  "finch",
  "forge",
  "garden",
  "harbor",
  "hearth",
  "inkwell",
  "kiln",
  "lantern",
  "loom",
  "meadow",
  "nest",
  "orchard",
  "otter",
  "paddle",
  "quill",
  "raft",
  "ridge",
  "rover",
  "saucer",
  "sparrow",
  "studio",
  "summit",
  "teapot",
  "thicket",
  "torch",
  "wagon",
  "willow",
  "zephyr",
] as const;

/** Stable FNV-1a-ish hash for word picks (no crypto / I/O). */
export function hashTenantSlugSeed(raw: string): number {
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Last alphanumeric slice of user id — clash guard on the public URL. */
export function tenantSlugUidSuffix(userId: string, len = 6): string {
  const clean = userId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  if (!clean) return "000000".slice(0, len);
  return clean.slice(-len).padStart(len, "0");
}

/**
 * Build public slug: `{adj}-{noun}-{uid}` (or `{hint}-{uid}` when hint set).
 * Deterministic for the same userId (+ hint).
 */
export function whimsicalTenantSlug(input: {
  userId: string;
  /** Optional operator/test override for the fun stem (UID still appended). */
  slugHint?: string | null;
}): string {
  const uid = tenantSlugUidSuffix(input.userId, 6);
  const hintRaw = input.slugHint?.trim().toLowerCase() ?? "";
  const hintStem = hintRaw
    ? hintRaw.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 28)
    : "";

  let stem: string;
  if (hintStem) {
    stem = hintStem;
  } else {
    const h = hashTenantSlugSeed(input.userId);
    const adj =
      TENANT_SLUG_ADJECTIVES[h % TENANT_SLUG_ADJECTIVES.length] ?? "misty";
    const noun =
      TENANT_SLUG_NOUNS[(h >>> 8) % TENANT_SLUG_NOUNS.length] ?? "lantern";
    stem = `${adj}-${noun}`;
  }

  const combined = `${stem}-${uid}`.slice(0, 48).replace(/-+$/g, "");
  return normalizeTenantSlug(combined) ?? `studio-${uid}`;
}
