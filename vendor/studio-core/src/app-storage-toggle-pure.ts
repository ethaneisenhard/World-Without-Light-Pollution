/**
 * iCloud-style per-app storage toggle (ADR 0016).
 * Cloud On → compute.placement hosted; Off → local (This Mac).
 * Studio vault (chats/notes/media) stays on the vault Host either way.
 */

import {
  DEFAULT_CREATE_COMPUTE_PLACEMENT,
  type ComputePlacement,
  resolveComputePlacement,
} from "./compute-placement-pure.js";

export type AppStorageToggleRow = {
  projectId: string;
  name: string;
  placement: ComputePlacement;
  /** Switch checked = store project files on Cloud Host (hosted). */
  cloudOn: boolean;
  /** Short face under the name. */
  detail: string;
};

export function placementToCloudStorageOn(
  placement: ComputePlacement,
): boolean {
  return placement !== "local";
}

export function cloudStorageOnToPlacement(on: boolean): ComputePlacement {
  return on ? "hosted" : "local";
}

export function appStorageDetail(placement: ComputePlacement): string {
  if (placement === "local") {
    return "On this computer — project files via local compute";
  }
  if (placement === "byo") {
    return "On your server — BYO compute (not this computer)";
  }
  return "In Cloud — project files in the cloud";
}

export function buildAppStorageToggleRows(
  projects: readonly {
    id: string;
    name?: string;
    computePlacement?: ComputePlacement | null;
    compute?: unknown;
  }[],
): AppStorageToggleRow[] {
  return projects.map((p) => {
    const placement =
      (p.computePlacement &&
      (p.computePlacement === "hosted" ||
        p.computePlacement === "local" ||
        p.computePlacement === "byo")
        ? p.computePlacement
        : null) ??
      resolveComputePlacement(
        { compute: p.compute },
        DEFAULT_CREATE_COMPUTE_PLACEMENT,
      );
    return {
      projectId: p.id,
      name: (p.name || p.id).trim() || p.id,
      placement,
      cloudOn: placementToCloudStorageOn(placement),
      detail: appStorageDetail(placement),
    };
  });
}

/** Optimistic row after toggle — paint before server confirms. */
export function applyAppStorageToggleOptimistic(
  rows: readonly AppStorageToggleRow[],
  projectId: string,
  cloudOn: boolean,
): AppStorageToggleRow[] {
  const placement = cloudStorageOnToPlacement(cloudOn);
  return rows.map((r) =>
    r.projectId === projectId
      ? {
          ...r,
          placement,
          cloudOn,
          detail: appStorageDetail(placement),
        }
      : r,
  );
}

export function appStoragePatchBody(
  projectId: string,
  cloudOn: boolean,
): { projectId: string; placement: ComputePlacement } {
  return {
    projectId,
    placement: cloudStorageOnToPlacement(cloudOn),
  };
}

export function appStorageSectionCopy(): {
  title: string;
  body: string;
} {
  return {
    title: "App storage",
    body: "Choose where each app’s project files live. On = Cloud. Off = Local. Chats, notes, and media follow Cloud / local attach.",
  };
}
