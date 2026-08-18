/**
 * Transparent Hosted estimate receipt — pass-through infra + BrowserUI margin.
 * v0 estimates (USD/mo); not live Fly/CF invoices.
 */

import { getSidecarCatalogRow } from "./sidecar-catalog-registry-pure.js";
import {
  getProvisionPack,
  sidecarIdsForPack,
  type ProvisionPackId,
} from "./provision-pack-registry-pure.js";

export type HostedBillLineKind = "infra" | "margin" | "note";

export type HostedBillLine = {
  id: string;
  kind: HostedBillLineKind;
  label: string;
  /** Estimated USD per month (0 for note-only). */
  usdPerMonth: number;
  detail: string;
};

export type HostedBillReceipt = {
  packId: ProvisionPackId | string;
  packLabel: string;
  lines: HostedBillLine[];
  infraTotalUsd: number;
  marginUsd: number;
  /** infra + margin */
  customerTotalUsd: number;
  marginPercentOfInfra: number;
  footnotes: readonly string[];
};

/** Rough always-on Fly shared-cpu-1x 512MB + volume — update when SKUs change. */
const INFRA_USD: Record<string, { usd: number; label: string; detail: string }> =
  {
    host: {
      usd: 7.5,
      label: "Studio Host (Fly)",
      detail: "shared-cpu-1x · 512MB · ~1GB volume · always-on",
    },
    worker: {
      usd: 0.5,
      label: "Studio UI (Cloudflare Worker)",
      detail: "Shared edge Worker + D1 route lookup — low request volume estimate",
    },
    n8n: {
      usd: 7.5,
      label: "n8n (Fly)",
      detail: "shared-cpu-1x · 512MB · always-on automations",
    },
    "mpg-proxy": {
      usd: 3,
      label: "Postgres bridge (shared)",
      detail: "Shared MPG proxy estimate when attached",
    },
    haraka: {
      usd: 10,
      label: "Haraka mail",
      detail: "Always-on SMTP sidecar estimate",
    },
    zulip: {
      usd: 15,
      label: "Zulip",
      detail: "App + related compute estimate",
    },
    "zulip-db": {
      usd: 15,
      label: "Zulip Postgres",
      detail: "Managed PG flex estimate",
    },
    clickhouse: {
      usd: 20,
      label: "ClickHouse",
      detail: "OLAP sidecar estimate",
    },
  };

/** Ops / provisioner / support — stated explicitly (SELF-HOST-FIRST). */
export const BROWSERUI_MARGIN_PERCENT_OF_INFRA = 35;

export function estimateHostedReceipt(input: {
  packId: string;
  /** Override sidecars (e.g. deployment selection). */
  sidecarIds?: readonly string[];
}): HostedBillReceipt | { error: string } {
  const pack = getProvisionPack(input.packId);
  const sidecarIds = input.sidecarIds?.length
    ? [...input.sidecarIds]
    : sidecarIdsForPack(input.packId);
  if (!sidecarIds.length) {
    return { error: "unknown_pack_or_empty" };
  }

  const lines: HostedBillLine[] = [];
  let infraTotalUsd = 0;

  for (const id of sidecarIds) {
    const cat = getSidecarCatalogRow(id);
    const row = INFRA_USD[id];
    const usd = row?.usd ?? 5;
    infraTotalUsd += usd;
    lines.push({
      id: `infra-${id}`,
      kind: "infra",
      label: row?.label ?? cat?.label ?? id,
      usdPerMonth: usd,
      detail: row?.detail ?? "Estimated pass-through infra",
    });
  }

  const marginUsd =
    Math.round(infraTotalUsd * (BROWSERUI_MARGIN_PERCENT_OF_INFRA / 100) * 100) /
    100;
  lines.push({
    id: "margin-browserui",
    kind: "margin",
    label: "BrowserUI margin (ops)",
    usdPerMonth: marginUsd,
    detail: `${BROWSERUI_MARGIN_PERCENT_OF_INFRA}% of infra — provisioner, TLS, upgrades, support — not hidden in “Pro”`,
  });

  return {
    packId: pack?.id ?? input.packId,
    packLabel: pack?.label ?? input.packId,
    lines,
    infraTotalUsd: Math.round(infraTotalUsd * 100) / 100,
    marginUsd,
    customerTotalUsd: Math.round((infraTotalUsd + marginUsd) * 100) / 100,
    marginPercentOfInfra: BROWSERUI_MARGIN_PERCENT_OF_INFRA,
    footnotes: [
      "Estimates only — not a live Fly/Cloudflare invoice.",
      "Self-host / BYO Host: you pay providers; BrowserUI tool fee optional.",
      "Leave anytime: Host backup/cutover (ADR 0014) — no sync lock-in.",
    ],
  };
}

export function formatUsd(n: number): string {
  return `$${n.toFixed(2)}`;
}
