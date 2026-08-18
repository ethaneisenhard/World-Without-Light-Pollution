/**
 * Durable substrate registry — id → capabilities / readiness.
 * Route intent kinds via config fallbacks; never host if-trees for vendor behavior.
 */

import {
  isDurableSubstrateId,
  type DurableSubstrateId,
} from "./durable-runtime-pure.js";
import { inngestSubstrateReadiness } from "./durable-inngest-pure.js";

export type DurableCapability =
  | "steps"
  | "cron"
  | "wait"
  | "swarm"
  | "dag"
  | "emit";

export type DurableSubstrateReadiness = "ready" | "planned";

export type DurableSubstrateRow = {
  id: DurableSubstrateId;
  label: string;
  description: string;
  capabilities: readonly DurableCapability[];
  /** ready = adapter ships; planned = resolve to fake until ready (or failClosed). */
  readiness: DurableSubstrateReadiness;
};

export type DurableIntentKind = "background" | "swarm" | "dag" | "cron";

export type DurableConfig = {
  /** Product default for background / generic durable runs. */
  substrate: DurableSubstrateId;
  fallbacks: {
    swarm: DurableSubstrateId;
    dag: DurableSubstrateId;
    cron: DurableSubstrateId;
  };
};

/** Canonical substrate catalog — add a row, not a host branch. */
export const DURABLE_SUBSTRATE_CATALOG: readonly DurableSubstrateRow[] = [
  {
    id: "fake",
    label: "Fake (local)",
    description: "In-process step runner for tests and offline — memoized resume + wait",
    capabilities: ["steps", "wait", "emit"],
    readiness: "ready",
  },
  {
    id: "inngest",
    label: "Inngest",
    description: "Durable steps, cron, waitForEvent, fan-out — default background substrate",
    capabilities: ["steps", "cron", "wait", "emit"],
    readiness: "planned",
  },
  {
    id: "agent-room",
    label: "Agent room",
    description: "Studio Agent room swarm plane (local durable steps)",
    capabilities: ["steps", "swarm", "wait", "emit"],
    readiness: "ready",
  },
  {
    id: "n8n",
    label: "n8n",
    description: "Visual / human-built DAGs and ingest workflows",
    capabilities: ["dag", "wait", "emit"],
    readiness: "planned",
  },
  {
    id: "cf-workflows",
    label: "Cloudflare Workflows",
    description: "Prod Workers cron / step workflows",
    capabilities: ["steps", "cron", "wait"],
    readiness: "planned",
  },
];

export function defaultDurableConfig(): DurableConfig {
  return {
    substrate: "inngest",
    fallbacks: {
      swarm: "agent-room",
      dag: "n8n",
      cron: "cf-workflows",
    },
  };
}

export function getDurableSubstrate(
  id: string,
): DurableSubstrateRow | undefined {
  return DURABLE_SUBSTRATE_CATALOG.find((r) => r.id === id);
}

export function listDurableSubstrates(): readonly DurableSubstrateRow[] {
  return DURABLE_SUBSTRATE_CATALOG;
}

export function substrateHasCapability(
  id: DurableSubstrateId,
  capability: DurableCapability,
): boolean {
  const row = getDurableSubstrate(id);
  return row?.capabilities.includes(capability) ?? false;
}

/**
 * Pick substrate for an intent kind from config (pure routing).
 */
export function resolveDurableSubstrateForIntent(
  intent: DurableIntentKind,
  config: DurableConfig = defaultDurableConfig(),
): DurableSubstrateId {
  if (intent === "swarm") return config.fallbacks.swarm;
  if (intent === "dag") return config.fallbacks.dag;
  if (intent === "cron") return config.fallbacks.cron;
  return config.substrate;
}

/**
 * Effective readiness — catalog base, overridden by env probes / explicit map.
 */
export function resolveDurableSubstrateReadiness(
  id: DurableSubstrateId,
  opts?: {
    envGet?: (name: string) => string | undefined;
    readinessById?: Partial<Record<DurableSubstrateId, DurableSubstrateReadiness>>;
  },
): DurableSubstrateReadiness {
  if (opts?.readinessById?.[id]) return opts.readinessById[id]!;
  const row = getDurableSubstrate(id);
  if (!row) return "planned";
  if (row.readiness === "ready") return "ready";
  const envGet = opts?.envGet;
  if (!envGet) return row.readiness;
  if (id === "inngest") return inngestSubstrateReadiness(envGet);
  return row.readiness;
}

/**
 * Map product substrate → runnable adapter id.
 * Planned / unconfigured substrates fall back to `fake` unless failClosed.
 */
export function resolveRunnableDurableSubstrate(
  desired: DurableSubstrateId,
  opts?: {
    failClosed?: boolean;
    envGet?: (name: string) => string | undefined;
    readinessById?: Partial<Record<DurableSubstrateId, DurableSubstrateReadiness>>;
  },
): { substrate: DurableSubstrateId; degraded: boolean; reason?: string } {
  const desiredId = desired;
  const row = getDurableSubstrate(desiredId);
  if (!row) {
    return {
      substrate: "fake",
      degraded: true,
      reason: `unknown substrate ${desired}`,
    };
  }
  const readiness = resolveDurableSubstrateReadiness(desiredId, opts);
  if (readiness === "ready") {
    return { substrate: row.id as DurableSubstrateId, degraded: false };
  }
  if (opts?.failClosed) {
    return {
      substrate: desiredId,
      degraded: true,
      reason: `${desiredId} adapter not ready`,
    };
  }
  return {
    substrate: "fake",
    degraded: true,
    reason: `${desiredId} planned — using fake`,
  };
}

export function parseDurableConfig(raw: unknown): DurableConfig {
  const base = defaultDurableConfig();
  if (!raw || typeof raw !== "object") return base;
  const d = raw as Record<string, unknown>;
  const substrate = isDurableSubstrateId(d.substrate)
    ? d.substrate
    : base.substrate;
  const fb =
    d.fallbacks && typeof d.fallbacks === "object"
      ? (d.fallbacks as Record<string, unknown>)
      : {};
  const canon = (v: unknown, fallback: DurableSubstrateId): DurableSubstrateId => {
    if (!isDurableSubstrateId(v)) return fallback;
    return v;
  };
  return {
    substrate,
    fallbacks: {
      swarm: canon(fb.swarm, base.fallbacks.swarm),
      dag: canon(fb.dag, base.fallbacks.dag),
      cron: canon(fb.cron, base.fallbacks.cron),
    },
  };
}
