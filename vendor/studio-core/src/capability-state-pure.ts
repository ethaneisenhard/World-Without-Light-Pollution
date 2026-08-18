/**
 * Capability desired / probe → healthy (no I/O).
 */

import {
  getCapability,
  type CapabilityAuthKind,
  type CapabilityRow,
} from "./capability-catalog-pure.js";

export type CapabilityProbe = {
  /** Bits / config present for this capability. */
  installed: boolean;
  /** Env present / cli logged in / url set. */
  authOk: boolean;
  /** Optional detail for UI (bin path, missing env, …). */
  detail?: string;
};

export type CapabilityRuntimeState = {
  id: string;
  kind: CapabilityRow["kind"];
  label: string;
  desired: boolean;
  installed: boolean;
  authOk: boolean;
  healthy: boolean;
  authKind: CapabilityAuthKind;
  detail?: string;
  /** Soft deps that are not healthy when this row is desired. */
  blockedBy?: string[];
};

export type CapabilityDesiredSet = ReadonlySet<string> | readonly string[];

function asSet(desired: CapabilityDesiredSet): Set<string> {
  if (desired instanceof Set) return desired;
  return new Set(desired.map((id) => id.trim()).filter(Boolean));
}

/**
 * Resolve one capability against desired set + probe.
 * Healthy = desired ∧ installed ∧ authOk ∧ soft deps healthy (when those deps are also desired or required).
 */
export function resolveCapabilityState(
  capabilityId: string,
  desired: CapabilityDesiredSet,
  probe: CapabilityProbe | undefined,
  /** Precomputed healthy map for dependsOn (optional). */
  healthyById?: ReadonlyMap<string, boolean>,
): CapabilityRuntimeState | null {
  const row = getCapability(capabilityId);
  if (!row) return null;
  const want = asSet(desired).has(row.id);
  const installed = probe?.installed === true;
  const authOk = probe?.authOk === true;
  let healthy = want && installed && authOk;
  const blockedBy: string[] = [];
  if (healthy && row.dependsOn?.length) {
    for (const dep of row.dependsOn) {
      const depOk = healthyById?.get(dep) === true;
      if (!depOk) {
        healthy = false;
        blockedBy.push(dep);
      }
    }
  }
  return {
    id: row.id,
    kind: row.kind,
    label: row.label,
    desired: want,
    installed,
    authOk,
    healthy,
    authKind: row.auth.kind,
    detail: probe?.detail,
    blockedBy: blockedBy.length ? blockedBy : undefined,
  };
}

/** Resolve all catalog rows (or only desired + probed). */
export function resolveCapabilityStates(
  desired: CapabilityDesiredSet,
  probes: ReadonlyMap<string, CapabilityProbe> | Record<string, CapabilityProbe>,
): CapabilityRuntimeState[] {
  const want = asSet(desired);
  const probeMap =
    probes instanceof Map
      ? probes
      : new Map(Object.entries(probes));

  // First pass without deps
  const draft = new Map<string, CapabilityRuntimeState>();
  for (const id of new Set([...want, ...probeMap.keys()])) {
    const row = getCapability(id);
    if (!row) continue;
    const state = resolveCapabilityState(id, want, probeMap.get(id));
    if (state) draft.set(id, state);
  }

  const healthyById = new Map<string, boolean>();
  for (const [id, state] of draft) {
    healthyById.set(id, state.healthy);
  }

  // Second pass with dependsOn
  const out: CapabilityRuntimeState[] = [];
  for (const id of draft.keys()) {
    const state = resolveCapabilityState(
      id,
      want,
      probeMap.get(id),
      healthyById,
    );
    if (state) {
      out.push(state);
      healthyById.set(id, state.healthy);
    }
  }

  // Stable catalog order for known ids
  out.sort((a, b) => a.id.localeCompare(b.id));
  return out;
}

/** True when harness id (cursor / anthropic / …) is healthy in resolved states. */
export function isHarnessCapabilityHealthy(
  harnessId: string,
  states: readonly CapabilityRuntimeState[],
): boolean {
  const id = `harness:${harnessId.trim()}`;
  return states.some((s) => s.id === id && s.healthy);
}

/** Merge stack capability ids into a desired list (unique, stable). */
export function mergeDesiredCapabilities(
  current: readonly string[],
  add: readonly string[],
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const id of [...current, ...add]) {
    const key = id.trim();
    if (!key || seen.has(key)) continue;
    if (!getCapability(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}
