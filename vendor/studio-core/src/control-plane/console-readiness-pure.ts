/**
 * Control-plane console readiness projection (no I/O).
 * Separates API host vs Studio UI Worker so operators are not confused by *.fly.dev.
 */

import {
  getSidecarCatalogRow,
  listSidecarCatalog,
  type SidecarCatalogRow,
} from "./sidecar-catalog-registry-pure.js";
import type { ControlPlaneDeployment } from "./tenant-deployment-pure.js";

export type ConsoleLinkKind = "studio_ui" | "api_host" | "sidecar" | "none";

export type ConsoleResourceState =
  | "live"
  | "attached"
  | "not_provisioned"
  | "planned"
  | "optional_off";

export type ConsoleReadinessRow = {
  sidecarId: string;
  label: string;
  description: string;
  provider: SidecarCatalogRow["provider"];
  required: boolean;
  selected: boolean;
  state: ConsoleResourceState;
  /** Public URL when attached. */
  url: string | null;
  /** What opening this URL actually is. */
  linkKind: ConsoleLinkKind;
  /** Short operator-facing status copy. */
  statusLabel: string;
  /** Longer explanation (why not Studio UI, etc.). */
  detail: string;
  /** Can this row's provision button run today? */
  canProvision: boolean;
  provisionActionLabel: string;
};

export type ConsoleStackSummary = {
  hostUrl: string | null;
  workerUrl: string | null;
  studioOpenReady: boolean;
  studioOpenBlockedReason: string | null;
  headline: string;
  rows: ConsoleReadinessRow[];
};

function resourceUrl(
  deployment: ControlPlaneDeployment,
  sidecarId: string,
): string | null {
  return (
    deployment.resources.find((r) => r.sidecarId === sidecarId)?.url ?? null
  );
}

function rowFor(
  catalog: SidecarCatalogRow,
  deployment: ControlPlaneDeployment,
): ConsoleReadinessRow {
  const selected = deployment.sidecarIds.includes(catalog.id);
  const url = resourceUrl(deployment, catalog.id);

  if (catalog.id === "worker") {
    const hostUrl = resourceUrl(deployment, "host");
    return {
      sidecarId: catalog.id,
      label: catalog.label,
      description: catalog.description,
      provider: catalog.provider,
      required: catalog.required,
      selected,
      state: url ? "attached" : hostUrl ? "not_provisioned" : "planned",
      url,
      linkKind: "studio_ui",
      statusLabel: url
        ? "Studio UI attached"
        : hostUrl
          ? "Not provisioned"
          : "Needs host first",
      detail: url
        ? "Glass Box Studio shell on browserui.site (or custom domain later) — Open Studio UI."
        : hostUrl
          ? "Provision attaches `{slug}.browserui.site` (shared edge; Host→your Fly API). Custom nameservers later."
          : "Provision Studio Host (API) first, then Studio UI on browserui.site.",
      canProvision: Boolean(hostUrl),
      provisionActionLabel: url ? "Re-check Studio site" : "Provision Studio UI",
    };
  }

  if (catalog.id === "host") {
    return {
      sidecarId: catalog.id,
      label: catalog.label,
      description: catalog.description,
      provider: catalog.provider,
      required: catalog.required,
      selected,
      state: url ? "attached" : "not_provisioned",
      url,
      linkKind: "api_host",
      statusLabel: url ? "API host attached" : "Not provisioned",
      detail: url
        ? "Fly Machines API host — expect /health JSON (glassbox-studio), not the Studio chrome shell."
        : "Provision creates Fly app + volume + machine from the host image.",
      canProvision: true,
      provisionActionLabel: url ? "Re-check / attach" : "Provision",
    };
  }

  if (catalog.provider === "cloudflare") {
    return {
      sidecarId: catalog.id,
      label: catalog.label,
      description: catalog.description,
      provider: catalog.provider,
      required: catalog.required,
      selected,
      state: url ? "attached" : "planned",
      url,
      linkKind: url ? "sidecar" : "none",
      statusLabel: url ? "Attached" : "Not provisioned yet",
      detail: catalog.description,
      canProvision: false,
      provisionActionLabel: "Coming soon",
    };
  }

  if (!selected && !url && catalog.id !== "probe") {
    return {
      sidecarId: catalog.id,
      label: catalog.label,
      description: catalog.description,
      provider: catalog.provider,
      required: catalog.required,
      selected,
      state: "optional_off",
      url: null,
      linkKind: "none",
      statusLabel: "Not selected",
      detail: catalog.description,
      canProvision: true,
      provisionActionLabel: "Provision",
    };
  }

  return {
    sidecarId: catalog.id,
    label: catalog.label,
    description: catalog.description,
    provider: catalog.provider,
    required: catalog.required,
    selected: selected || catalog.id === "probe",
    state: url ? "attached" : "not_provisioned",
    url,
    linkKind: url ? "sidecar" : "none",
    statusLabel: url ? "Attached" : "Not provisioned",
    detail: catalog.description,
    canProvision: true,
    provisionActionLabel: url ? "Re-provision" : "Provision",
  };
}

export function projectConsoleStackSummary(
  deployment: ControlPlaneDeployment,
  catalog: readonly SidecarCatalogRow[] = listSidecarCatalog(),
): ConsoleStackSummary {
  const rows = catalog.map((c) => rowFor(c, deployment));
  const host = rows.find((r) => r.sidecarId === "host") ?? null;
  const worker = rows.find((r) => r.sidecarId === "worker") ?? null;
  const hostUrl = host?.url ?? null;
  const workerUrl = worker?.url ?? null;
  const studioOpenReady = Boolean(workerUrl);
  const studioOpenBlockedReason = studioOpenReady
    ? null
    : hostUrl
      ? "Studio UI Worker is not provisioned yet. Host API is up — that URL is not the shell."
      : "Provision Studio Host first, then Studio UI Worker (next).";

  let headline: string;
  if (studioOpenReady) {
    headline = "Studio UI ready — open the Worker URL.";
  } else if (hostUrl) {
    headline =
      "API host attached. Studio shell Worker still pending — do not expect UI at the Fly host URL.";
  } else {
    headline = "Nothing provisioned yet. Start with Studio Host (API).";
  }

  return {
    hostUrl,
    workerUrl,
    studioOpenReady,
    studioOpenBlockedReason,
    headline,
    rows,
  };
}

export function readinessRow(
  deployment: ControlPlaneDeployment,
  sidecarId: string,
): ConsoleReadinessRow | null {
  const catalog = getSidecarCatalogRow(sidecarId);
  if (!catalog) return null;
  return rowFor(catalog, deployment);
}
