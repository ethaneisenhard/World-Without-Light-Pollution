/**
 * Harness → default pet id registry + random assign (pure).
 */

import { STUDIO_PET_SHIPPED_IDS } from "./design-pure.js";

/** Fallback when harness unknown / no override. */
export const FLEET_PET_FALLBACK_ID = "battle-beast";

/**
 * Seed defaults — cute slugs bikeshed later; Settings overrides win.
 * Unknown harness → random from pool.
 */
export const HARNESS_PET_DEFAULTS: Readonly<Record<string, string>> = {
  studio: "battle-beast",
  cursor: "airring",
  hermes: "battle-beast",
  grok: "airring",
  kody: "battle-beast",
};

export type FleetPetResolveInput = {
  harnessId: string | null | undefined;
  /** Per-harness override map from config. */
  harnessPets?: Readonly<Record<string, string>> | null;
  /** Explicit job pet already set. */
  petId?: string | null;
  /** Deterministic random — tests pass seed; prod may omit. */
  random?: () => number;
};

function petPool(): readonly string[] {
  const shipped = STUDIO_PET_SHIPPED_IDS as readonly string[];
  return shipped.length > 0 ? shipped : [FLEET_PET_FALLBACK_ID];
}

export function pickRandomFleetPetId(random: () => number = Math.random): string {
  const pool = petPool();
  const i = Math.floor(Math.abs(random()) * pool.length) % pool.length;
  return pool[i] ?? FLEET_PET_FALLBACK_ID;
}

/**
 * Resolve pet for a desk: explicit → harness override → harness default → random.
 */
export function resolveFleetPetId(input: FleetPetResolveInput): string {
  const explicit = input.petId?.trim();
  if (explicit) return explicit;

  const harness = (input.harnessId ?? "").trim().toLowerCase();
  if (harness && input.harnessPets?.[harness]?.trim()) {
    return input.harnessPets[harness]!.trim();
  }
  if (harness && HARNESS_PET_DEFAULTS[harness]) {
    return HARNESS_PET_DEFAULTS[harness]!;
  }
  return pickRandomFleetPetId(input.random);
}
