/**
 * Hosted provision packs — id → sidecars (registry, not host if-trees).
 * ADR 0016: packs stamp default compute.placement + hosted media provider.
 */

import type { ComputePlacement } from "../compute-placement-pure.js";
import {
  listDefaultDogfoodSidecars,
  orderSidecarsForProvision,
} from "./sidecar-catalog-registry-pure.js";

export type ProvisionPackId =
  | "studio-cloud"
  | "studio-automate"
  | "all-inclusive";

export type ProvisionPackRow = {
  id: ProvisionPackId;
  label: string;
  description: string;
  /** Catalog sidecar ids (unordered; use orderSidecarsForProvision). */
  sidecarIds: readonly string[];
  /** Primary CTA in /app. */
  primary: boolean;
  /** Shown when adapters incomplete (n8n image, etc.). */
  available: boolean;
  /** ADR 0016 — new apps on this pack. */
  defaultComputePlacement: ComputePlacement;
  /** Section provider defaults for hosted tenants. */
  defaultProviders: {
    media?: { plugin: string };
  };
};

export const PROVISION_PACKS: readonly ProvisionPackRow[] = [
  {
    id: "studio-cloud",
    label: "Studio Cloud",
    description:
      "Studio Host (vault SoT) + shell on {slug}.browserui.site. Compute defaults hosted; media → R2.",
    sidecarIds: ["host", "worker"],
    primary: true,
    available: true,
    defaultComputePlacement: "hosted",
    defaultProviders: { media: { plugin: "media-r2" } },
  },
  {
    id: "studio-automate",
    label: "Studio + Automate",
    description:
      "Studio Cloud plus per-tenant n8n. Vault on Host; compute hosted; media → R2.",
    sidecarIds: ["host", "worker", "n8n", "litellm"],
    primary: false,
    available: true,
    defaultComputePlacement: "hosted",
    defaultProviders: { media: { plugin: "media-r2" } },
  },
  {
    id: "all-inclusive",
    label: "All-inclusive (preview)",
    description:
      "Dogfood sidecar set when adapters exist — mail, chat, analytics later.",
    sidecarIds: listDefaultDogfoodSidecars().map((r) => r.id),
    primary: false,
    available: false,
    defaultComputePlacement: "hosted",
    defaultProviders: { media: { plugin: "media-r2" } },
  },
] as const;

export function getProvisionPack(
  id: string,
): ProvisionPackRow | undefined {
  return PROVISION_PACKS.find((p) => p.id === id);
}

export function listProvisionPacks(): readonly ProvisionPackRow[] {
  return PROVISION_PACKS;
}

export function listAvailableProvisionPacks(): readonly ProvisionPackRow[] {
  return PROVISION_PACKS.filter((p) => p.available);
}

export function sidecarIdsForPack(packId: string): string[] {
  const pack = getProvisionPack(packId);
  if (!pack) return [];
  return orderSidecarsForProvision(pack.sidecarIds);
}

/** Defaults stamped onto new tenant / workspace create from a pack. */
export function provisionPackCreateDefaults(packId: string): {
  computePlacement: ComputePlacement;
  providers: { media?: { plugin: string } };
} | null {
  const pack = getProvisionPack(packId);
  if (!pack) return null;
  return {
    computePlacement: pack.defaultComputePlacement,
    providers: { ...pack.defaultProviders },
  };
}

/** ADR 0014 + 0016 steps shown above provision CTAs. */
export const HOST_ATTACH_PROVISION_STEPS = [
  {
    n: 1,
    title: "Host = vault source of truth",
    body: "Chats, notes, media, calendar, and registry live on your Host — not in the shell.",
  },
  {
    n: 2,
    title: "Shell attaches",
    body: "Shared Studio UI on {slug}.browserui.site proxies to Cloud. Local UI can attach the same Cloud vault.",
  },
  {
    n: 3,
    title: "Compute is placement",
    body: "New apps default to Cloud compute. Local mapped roots are opt-in — vault stays in Cloud.",
  },
  {
    n: 4,
    title: "Sidecars optional; leave = cutover",
    body: "n8n billed separately. Leave/join = backup/restore — not sync between Cloud and Local.",
  },
] as const;
