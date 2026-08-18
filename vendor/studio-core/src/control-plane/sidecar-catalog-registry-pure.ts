/**
 * BrowserUI control plane — cloud sidecar catalog (no I/O).
 * Add/remove rows here; orchestrators look up by id.
 */

export type SidecarProvider = "fly" | "cloudflare" | "external";

export type SidecarPlan = "always-on" | "scale-to-zero" | "shared";

export type SidecarCatalogRow = {
  id: string;
  label: string;
  description: string;
  provider: SidecarProvider;
  defaultPlan: SidecarPlan;
  /** Required for a minimal Glass Box Studio cloud deployment. */
  required: boolean;
  /** Other catalog ids that must exist first. */
  dependsOn: readonly string[];
  /** Env keys the shell may receive after provision. */
  envKeys: readonly string[];
  /** Dogfood starter pack default. */
  enabledByDefault: boolean;
};

/** Canonical sidecar catalog — extend with a row, not a host branch. */
export const SIDECAR_CATALOG: readonly SidecarCatalogRow[] = [
  {
    id: "worker",
    label: "Studio UI (Worker)",
    description: "Cloudflare Worker — Glass Box Studio shell UI",
    provider: "cloudflare",
    defaultPlan: "always-on",
    required: true,
    dependsOn: [],
    envKeys: ["APP_ORIGIN"],
    enabledByDefault: true,
  },
  {
    id: "host",
    label: "Studio Host (API)",
    description: "Always-on API / ledger / serve",
    provider: "fly",
    defaultPlan: "always-on",
    required: true,
    dependsOn: [],
    envKeys: ["STUDIO_API_PROXY", "STUDIO_HOST_PUBLIC_URL"],
    enabledByDefault: true,
  },
  {
    id: "mpg-proxy",
    label: "Fly MPG proxy",
    description: "Public bridge to Fly Managed Postgres for Hyperdrive",
    provider: "fly",
    defaultPlan: "shared",
    required: false,
    dependsOn: [],
    envKeys: ["DATABASE_URL", "HYPERDRIVE"],
    enabledByDefault: true,
  },
  {
    id: "n8n",
    label: "n8n",
    description: "Automations + MCP workflows",
    provider: "fly",
    defaultPlan: "always-on",
    required: false,
    dependsOn: [],
    envKeys: ["N8N_BASE_URL", "N8N_API_KEY"],
    enabledByDefault: true,
  },
  {
    id: "litellm",
    label: "LiteLLM gateway",
    description:
      "OpenAI-compat model gateway — vanity gateway.{slug}.glassboxcomputer.site",
    provider: "fly",
    defaultPlan: "always-on",
    required: false,
    dependsOn: ["host"],
    envKeys: ["LITELLM_BASE_URL", "LITELLM_API_KEY"],
    enabledByDefault: true,
  },
  {
    id: "haraka",
    label: "Haraka (mail)",
    description: "SMTP inbound / outbound mail sidecar",
    provider: "fly",
    defaultPlan: "always-on",
    required: false,
    dependsOn: [],
    envKeys: ["MAIL_HOST", "SMTP_URL"],
    enabledByDefault: false,
  },
  {
    id: "zulip-db",
    label: "Zulip Postgres",
    description: "Postgres flex for Zulip",
    provider: "fly",
    defaultPlan: "always-on",
    required: false,
    dependsOn: [],
    envKeys: ["ZULIP_DATABASE_URL"],
    enabledByDefault: false,
  },
  {
    id: "zulip",
    label: "Zulip",
    description: "Team / community chat",
    provider: "fly",
    defaultPlan: "always-on",
    required: false,
    dependsOn: ["zulip-db"],
    envKeys: ["ZULIP_URL"],
    enabledByDefault: false,
  },
  {
    id: "clickhouse",
    label: "ClickHouse",
    description: "Analytics OLAP",
    provider: "fly",
    defaultPlan: "always-on",
    required: false,
    dependsOn: [],
    envKeys: ["CLICKHOUSE_URL"],
    enabledByDefault: false,
  },
  {
    id: "bun-fly",
    label: "Bun (Fly)",
    description: "Legacy Bun runtime path — optional",
    provider: "fly",
    defaultPlan: "scale-to-zero",
    required: false,
    dependsOn: [],
    envKeys: [],
    enabledByDefault: false,
  },
  {
    id: "probe",
    label: "Provision probe",
    description: "Empty Fly app — proves control-plane create without full host stack",
    provider: "fly",
    defaultPlan: "scale-to-zero",
    required: false,
    dependsOn: [],
    envKeys: [],
    enabledByDefault: false,
  },
] as const;

export function getSidecarCatalogRow(
  id: string,
): SidecarCatalogRow | undefined {
  return SIDECAR_CATALOG.find((row) => row.id === id);
}

export function listSidecarCatalog(): readonly SidecarCatalogRow[] {
  return SIDECAR_CATALOG;
}

export function listRequiredSidecars(): readonly SidecarCatalogRow[] {
  return SIDECAR_CATALOG.filter((row) => row.required);
}

export function listDefaultDogfoodSidecars(): readonly SidecarCatalogRow[] {
  return SIDECAR_CATALOG.filter((row) => row.enabledByDefault);
}

/**
 * Topological order for provision (deps first). Unknown ids skipped.
 * Cycles → best-effort order among remaining (no throw — orchestrator can fail).
 */
export function orderSidecarsForProvision(
  ids: readonly string[],
): string[] {
  const want = new Set(ids);
  const done = new Set<string>();
  const out: string[] = [];

  function visit(id: string) {
    if (done.has(id) || !want.has(id)) return;
    const row = getSidecarCatalogRow(id);
    if (!row) {
      done.add(id);
      return;
    }
    for (const dep of row.dependsOn) {
      if (want.has(dep)) visit(dep);
    }
    if (!done.has(id)) {
      done.add(id);
      out.push(id);
    }
  }

  for (const id of ids) visit(id);
  return out;
}
