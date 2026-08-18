/**
 * Studio capability plane — catalog rows + stack packs (no I/O).
 * Settings one-click, onboard stacks, and Host SKU all resolve against this map.
 */

import { MCP_STARTER_PACKS } from "./mcp-starter-packs-pure.js";

export type CapabilityKind =
  | "harness"
  | "mcp"
  | "skill"
  | "integration";

export type CapabilityAuthKind =
  | "none"
  | "env"
  | "cli-login"
  | "url-env"
  | "oauth";

export type CapabilityInstallKind =
  | "none"
  | "mcp-starter-pack"
  | "host-cli-script"
  | "skill-enable"
  | "config-flag";

export type CapabilityRow = {
  id: string;
  kind: CapabilityKind;
  label: string;
  description: string;
  install: {
    kind: CapabilityInstallKind;
    /** MCP starter pack id, peer script basename, or skill id. */
    ref?: string;
    /** Preferred binary on PATH (host-cli). */
    bin?: string;
  };
  auth: {
    kind: CapabilityAuthKind;
    env?: string;
  };
  /** Other capability ids that should be healthy first (soft). */
  dependsOn?: readonly string[];
};

export type CapabilityStackPack = {
  id: string;
  label: string;
  description: string;
  /** Capability ids (e.g. harness:anthropic). */
  capabilities: readonly string[];
};

function mcpRowsFromStarterPacks(): CapabilityRow[] {
  return MCP_STARTER_PACKS.map((pack) => ({
    id: `mcp:${pack.id}`,
    kind: "mcp" as const,
    label: pack.label,
    description: pack.description,
    install: { kind: "mcp-starter-pack" as const, ref: pack.id },
    auth:
      pack.server.authHeaderEnv != null
        ? { kind: "env" as const, env: pack.server.authHeaderEnv }
        : { kind: "none" as const },
  }));
}

/** Canonical catalog — add a row, not a host branch. */
export const CAPABILITY_CATALOG: readonly CapabilityRow[] = [
  {
    id: "harness:anthropic",
    kind: "harness",
    label: "Anthropic (Claude API)",
    description: "Studio AI loop via ANTHROPIC_API_KEY — default Hosted path",
    install: { kind: "config-flag", ref: "anthropic" },
    auth: { kind: "env", env: "ANTHROPIC_API_KEY" },
  },
  {
    id: "harness:deepseek",
    kind: "harness",
    label: "DeepSeek (API)",
    description: "DeepSeek chat completions via DEEPSEEK_API_KEY",
    install: { kind: "config-flag", ref: "deepseek" },
    auth: { kind: "env", env: "DEEPSEEK_API_KEY" },
  },
  {
    id: "harness:cursor",
    kind: "harness",
    label: "Cursor Agent",
    description: "Host Cursor Agent CLI (cursor-agent) + login",
    install: {
      kind: "host-cli-script",
      ref: "cursor",
      bin: "cursor-agent",
    },
    auth: { kind: "cli-login" },
  },
  {
    id: "harness:hermes",
    kind: "harness",
    label: "Hermes",
    description: "Host Hermes CLI (hermes chat)",
    install: { kind: "host-cli-script", ref: "hermes", bin: "hermes" },
    auth: { kind: "cli-login" },
  },
  {
    id: "harness:grok",
    kind: "harness",
    label: "Grok Build",
    description: "Host Grok Build CLI (grok) — `grok login` or XAI_API_KEY",
    install: { kind: "host-cli-script", ref: "grok", bin: "grok" },
    // Primary: grok login → ~/.grok/auth.json; headless also accepts XAI_API_KEY.
    auth: { kind: "cli-login", env: "XAI_API_KEY" },
  },
  {
    id: "mcp:kody",
    kind: "mcp",
    label: "Kody",
    description:
      "Kent’s tool plane. Connect it here to add those tools alongside Studio.",
    install: { kind: "config-flag", ref: "kody-mcp" },
    auth: { kind: "url-env", env: "KODY_BASE_URL" },
  },
  ...mcpRowsFromStarterPacks(),
  {
    id: "skill:chrome",
    kind: "skill",
    label: "Chrome skill",
    description: "Studio chrome MCP guidance (skills.read id=chrome)",
    install: { kind: "skill-enable", ref: "chrome" },
    auth: { kind: "none" },
  },
  {
    id: "integration:n8n",
    kind: "integration",
    label: "n8n automation",
    description: "Project automation via n8n — pair with mcp:n8n-local",
    install: { kind: "config-flag", ref: "n8n" },
    auth: { kind: "env", env: "N8N_MCP_TOKEN" },
    dependsOn: ["mcp:n8n-local"],
  },
];

/** Stack packs — onboard / SKU pick these, not raw curl. */
export const CAPABILITY_STACKS: readonly CapabilityStackPack[] = [
  {
    id: "api-only",
    label: "Claude API",
    description: "Anthropic API + Studio MCP — default cloud Host",
    capabilities: ["harness:anthropic", "mcp:studio-http", "skill:chrome"],
  },
  {
    id: "coding-cursor",
    label: "Cursor coding",
    description: "Cursor Agent CLI on Host + Studio MCP",
    capabilities: ["harness:cursor", "mcp:studio-http", "skill:chrome"],
  },
  {
    id: "automation-n8n",
    label: "Automation (n8n)",
    description: "n8n MCP + integration flag",
    capabilities: ["mcp:n8n-local", "integration:n8n"],
  },
];

export function getCapability(id: string): CapabilityRow | undefined {
  const key = id.trim();
  if (!key) return undefined;
  // Legacy Settings / desiredCapabilities id — Kody is MCP plane now.
  if (key === "harness:kody") {
    return CAPABILITY_CATALOG.find((row) => row.id === "mcp:kody");
  }
  return CAPABILITY_CATALOG.find((row) => row.id === key);
}

export function getCapabilityStack(
  stackId: string,
): CapabilityStackPack | undefined {
  const key = stackId.trim();
  if (!key) return undefined;
  return CAPABILITY_STACKS.find((s) => s.id === key);
}

/** Flatten one or more stack ids → unique capability ids (order preserved). */
export function flattenStacks(stackIds: readonly string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const stackId of stackIds) {
    const pack = getCapabilityStack(stackId);
    if (!pack) continue;
    for (const id of pack.capabilities) {
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

/** Harness id from capability id (`harness:cursor` → `cursor`). */
export function harnessIdFromCapabilityId(capabilityId: string): string | null {
  const row = getCapability(capabilityId);
  if (!row || row.kind !== "harness") return null;
  const prefix = "harness:";
  if (!row.id.startsWith(prefix)) return null;
  return row.id.slice(prefix.length);
}

export function listCapabilitiesByKind(
  kind: CapabilityKind,
): readonly CapabilityRow[] {
  return CAPABILITY_CATALOG.filter((row) => row.kind === kind);
}

/** First harness id in a stack (for defaultHarness after apply). */
export function defaultHarnessFromStack(stackId: string): string | null {
  const pack = getCapabilityStack(stackId);
  if (!pack) return null;
  for (const id of pack.capabilities) {
    const hid = harnessIdFromCapabilityId(id);
    if (hid) return hid;
  }
  return null;
}

/**
 * Parse `STUDIO_STACKS` env (comma-separated) → stack ids.
 * Empty / whitespace → `["api-only"]` (cloud Host default).
 */
export function parseStudioStacksEnv(raw: string | undefined | null): string[] {
  if (raw == null || !String(raw).trim()) return ["api-only"];
  const ids = String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((id) => Boolean(getCapabilityStack(id)));
  return ids.length ? ids : ["api-only"];
}

/** Seed patch for Host config.json from stacks (no I/O). */
export function studioAiSeedFromStacks(stackIds: readonly string[]): {
  defaultHarness: string;
  desiredCapabilities: string[];
} {
  const ids = stackIds.length ? [...stackIds] : ["api-only"];
  const desired = flattenStacks(ids);
  const harness =
    defaultHarnessFromStack(ids[0]!) ??
    harnessIdFromCapabilityId(desired.find((d) => d.startsWith("harness:")) ?? "") ??
    "anthropic";
  return { defaultHarness: harness, desiredCapabilities: desired };
}
