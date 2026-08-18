/**
 * Per-project compute placement (ADR 0016) — where source / Live / harness run.
 * Vault (chats, notes, media, calendar) stays on the attached vault Host.
 */

export const COMPUTE_PLACEMENTS = ["hosted", "local", "byo"] as const;

export type ComputePlacement = (typeof COMPUTE_PLACEMENTS)[number];

export type ProjectComputeConfig = {
  placement: ComputePlacement;
  /** Named runtime Host / bridge id when not co-located with vault. */
  runtimeHostId?: string;
  /** Absolute or Host-relative project root on the compute target. */
  root?: string;
};

/** New workspace / scaffold default — vault Host materializes roots. */
export const DEFAULT_CREATE_COMPUTE_PLACEMENT: ComputePlacement = "hosted";

/** Link of an existing path — usually the operator's machine. */
export const DEFAULT_LINK_COMPUTE_PLACEMENT: ComputePlacement = "local";

export function isComputePlacement(raw: unknown): raw is ComputePlacement {
  return (
    typeof raw === "string" &&
    (COMPUTE_PLACEMENTS as readonly string[]).includes(raw)
  );
}

export function parseComputePlacement(
  raw: unknown,
  fallback: ComputePlacement = DEFAULT_CREATE_COMPUTE_PLACEMENT,
): ComputePlacement {
  if (isComputePlacement(raw)) return raw;
  return fallback;
}

export function normalizeProjectCompute(
  raw: unknown,
  fallback: ComputePlacement = DEFAULT_CREATE_COMPUTE_PLACEMENT,
): ProjectComputeConfig {
  const rec =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const placement = parseComputePlacement(rec.placement, fallback);
  const runtimeHostId =
    typeof rec.runtimeHostId === "string" && rec.runtimeHostId.trim()
      ? rec.runtimeHostId.trim()
      : undefined;
  const root =
    typeof rec.root === "string" && rec.root.trim()
      ? rec.root.trim()
      : undefined;
  const out: ProjectComputeConfig = { placement };
  if (runtimeHostId) out.runtimeHostId = runtimeHostId;
  if (root) out.root = root;
  return out;
}

/** Resolve placement from project.json-shaped config. */
export function resolveComputePlacement(
  config: { compute?: unknown } | null | undefined,
  fallback: ComputePlacement = DEFAULT_CREATE_COMPUTE_PLACEMENT,
): ComputePlacement {
  return normalizeProjectCompute(config?.compute, fallback).placement;
}

export function withComputePlacement<T extends Record<string, unknown>>(
  projectJson: T,
  compute: ProjectComputeConfig | ComputePlacement,
): T & { compute: ProjectComputeConfig } {
  const normalized =
    typeof compute === "string"
      ? normalizeProjectCompute({ placement: compute })
      : normalizeProjectCompute(compute, compute.placement);
  return { ...projectJson, compute: normalized };
}

export type ComputePlacementLabel = {
  placement: ComputePlacement;
  label: string;
  summary: string;
};

export function computePlacementLabel(
  placement: ComputePlacement,
): ComputePlacementLabel {
  if (placement === "local") {
    return {
      placement,
      label: "Local compute",
      summary:
        "Project files and runtimes on this machine (or bridge). Vault stays in the cloud.",
    };
  }
  if (placement === "byo") {
    return {
      placement,
      label: "BYO compute",
      summary:
        "Project files and runtimes on your server. Vault stays on the attached cloud or local.",
    };
  }
  return {
    placement: "hosted",
    label: "Cloud compute",
    summary:
      "Project files and runtimes in the cloud. Same place as chats/notes until cattle runners land.",
  };
}

/** Tenant / studio default before per-project override. */
export function resolveDefaultComputePlacement(input?: {
  studioDefault?: unknown;
  packDefault?: unknown;
}): ComputePlacement {
  if (isComputePlacement(input?.studioDefault)) return input.studioDefault;
  if (isComputePlacement(input?.packDefault)) return input.packDefault;
  return DEFAULT_CREATE_COMPUTE_PLACEMENT;
}
