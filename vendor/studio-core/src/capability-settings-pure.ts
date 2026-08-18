/**
 * Settings → Harnesses card projection from capability plane (no I/O).
 * Kody lives under MCP tools (`mcp:kody`) — not a harness card.
 */

import {
  CAPABILITY_CATALOG,
  CAPABILITY_STACKS,
  getCapability,
  harnessIdFromCapabilityId,
  type CapabilityRow,
  type CapabilityStackPack,
} from "./capability-catalog-pure.js";
import type { CapabilityRuntimeState } from "./capability-state-pure.js";
import {
  mcpPlaneOptionLabel,
  resolveKodyMcpUrl,
  type McpPlaneId,
} from "./mcp-plane-pure.js";
import {
  peerReadinessProbeFromCapabilityStates,
  projectPeerReadinessRow,
  type PeerReadinessStatus,
} from "./peer-readiness-pure.js";

export type HarnessSettingsCard = {
  capabilityId: string;
  harnessId: string;
  label: string;
  description: string;
  desired: boolean;
  installed: boolean;
  authOk: boolean;
  healthy: boolean;
  authKind: CapabilityRuntimeState["authKind"];
  detail?: string;
  /** Primary CTA for the card. */
  action: "install" | "connect" | "set-default" | "ready";
  actionLabel: string;
  /** Glass-box setup readiness (from Host probe / capability states). */
  readinessStatus?: PeerReadinessStatus;
  readinessHint?: string;
};

/** Painted badge on a Harnesses peer card (loading until probe is definite). */
export type HarnessSettingsCardFace =
  | "loading"
  | "ready"
  | "needs-setup"
  | "installed"
  | "needs-connect"
  | "not-installed";

export type HarnessSettingsLoadStatus =
  | "loading"
  | "ready"
  | "installing"
  | "connecting";

/**
 * Face gate — never paint Needs setup / Not installed while Cloud probe is
 * still in flight or this peer’s readiness is unknown.
 */
export function resolveHarnessSettingsCardFace(input: {
  loadStatus: HarnessSettingsLoadStatus;
  hasStates: boolean;
  readinessStatus?: PeerReadinessStatus | null;
  healthy: boolean;
  installed: boolean;
  authOk: boolean;
}): HarnessSettingsCardFace {
  switch (input.loadStatus) {
    case "loading":
      if (!input.hasStates) return "loading";
      break;
    case "ready":
    case "installing":
    case "connecting":
      break;
    default: {
      const _exhaustive: never = input.loadStatus;
      return _exhaustive;
    }
  }

  switch (input.readinessStatus) {
    case "unknown":
      return "loading";
    case "ready":
      return "ready";
    case "needs-setup":
      return "needs-setup";
    case null:
    case undefined:
      break;
    default: {
      const _exhaustive: never = input.readinessStatus;
      return _exhaustive;
    }
  }

  if (input.healthy) return "ready";
  if (input.installed && input.authOk) return "installed";
  if (input.installed) return "needs-connect";
  return "not-installed";
}

/** Kody MCP plane card for Settings → MCP tools (not Harnesses). */
export type KodyMcpSettingsCard = {
  capabilityId: "mcp:kody";
  label: string;
  description: string;
  /** KODY_BASE_URL → /mcp resolved. */
  mcpUrl: string | null;
  configured: boolean;
  desired: boolean;
  authOk: boolean;
  healthy: boolean;
  readinessStatus: PeerReadinessStatus;
  readinessHint: string;
  defaultPlaneLabel: string;
  action: "connect" | "enable" | "ready";
  actionLabel: string;
  detail?: string;
};

export function listHarnessCapabilityRows(): CapabilityRow[] {
  return CAPABILITY_CATALOG.filter((r) => r.kind === "harness");
}

export function getKodyMcpCapabilityRow(): CapabilityRow | undefined {
  return getCapability("mcp:kody");
}

export function projectHarnessSettingsCards(input: {
  states: readonly CapabilityRuntimeState[];
  defaultHarness: string;
}): HarnessSettingsCard[] {
  const byId = new Map(input.states.map((s) => [s.id, s]));
  const def = input.defaultHarness.trim();
  const probe = peerReadinessProbeFromCapabilityStates(input.states);
  return listHarnessCapabilityRows().map((row) => {
    const state = byId.get(row.id);
    const harnessId = harnessIdFromCapabilityId(row.id) ?? row.id;
    const desired = state?.desired === true;
    const installed = state?.installed === true;
    const authOk = state?.authOk === true;
    const healthy = state?.healthy === true;
    let action: HarnessSettingsCard["action"] = "install";
    let actionLabel = "Install";
    if (!installed) {
      action = "install";
      actionLabel = "Install";
    } else if (!authOk) {
      action = "connect";
      const authKind = state?.authKind ?? row.auth.kind;
      switch (authKind) {
        case "cli-login":
          actionLabel =
            row.id === "harness:cursor"
              ? "Connect with Cursor"
              : "Connect (login)";
          break;
        case "oauth":
          actionLabel = "Connect (OAuth)";
          break;
        case "env":
        case "url-env":
          actionLabel = "Connect (key)";
          break;
        case "none":
          actionLabel = "Connect";
          break;
        default: {
          const _exhaustive: never = authKind;
          actionLabel = _exhaustive;
        }
      }
    } else if (desired && harnessId === def) {
      action = "ready";
      actionLabel = "Default";
    } else if (desired) {
      action = "set-default";
      actionLabel = "Set as default";
    } else {
      // On Host (bin/key ok) but not in desiredCapabilities yet.
      action = "install";
      actionLabel = "Enable";
    }
    const readiness = projectPeerReadinessRow(harnessId, probe);
    return {
      capabilityId: row.id,
      harnessId,
      label: row.label,
      description: row.description,
      desired,
      installed,
      authOk,
      healthy,
      authKind: state?.authKind ?? row.auth.kind,
      detail: state?.detail,
      action,
      actionLabel,
      readinessStatus: readiness.status,
      readinessHint: readiness.hint,
    };
  });
}

export function listCapabilityStacksForSettings(): readonly CapabilityStackPack[] {
  return CAPABILITY_STACKS;
}

export function stackIncludesHarness(
  stackId: string,
  harnessCapabilityId: string,
): boolean {
  const pack = CAPABILITY_STACKS.find((s) => s.id === stackId);
  return pack?.capabilities.includes(harnessCapabilityId) ?? false;
}

export function connectHintForCapability(capabilityId: string): string {
  const row = getCapability(capabilityId);
  if (!row) return "See Host docs for auth.";
  if (row.id === "harness:grok") {
    return "On the Host: `grok login` (writes ~/.grok/auth.json) or set XAI_API_KEY, then Refresh.";
  }
  if (row.id === "mcp:kody") {
    return "Set KODY_BASE_URL on the Host — default MCP plane is Studio + Kody.";
  }
  if (row.id === "harness:cursor") {
    return "Click Connect with Cursor — Studio opens a login link. Sign in, then we detect auth automatically.";
  }
  if (row.auth.kind === "cli-login") {
    return `On the Host: install binary then run login for ${row.install.bin ?? row.label}.`;
  }
  if (row.auth.kind === "oauth") {
    return "Click Connect — Studio opens the provider authorize URL. Tokens stay on the Host under ~/.glassbox-studio/mcp-tokens/.";
  }
  if (row.auth.kind === "env" || row.auth.kind === "url-env") {
    return `Set ${row.auth.env ?? "secret"} on the Host (host.env / secrets), then Install again.`;
  }
  if (row.auth.kind === "none") {
    return "Ready when Host probe is green.";
  }
  {
    const _exhaustive: never = row.auth.kind;
    return _exhaustive;
  }
}

/**
 * Settings → MCP tools — Kody plane card (orthogonal to harness / model).
 */
export function projectKodyMcpSettingsCard(input: {
  states: readonly CapabilityRuntimeState[];
  /** Composer default MCP plane (for copy). */
  defaultMcpPlane?: McpPlaneId | string | null;
  kodyBaseUrl?: string | null;
  kodyMcpUrl?: string | null;
}): KodyMcpSettingsCard {
  const row = getKodyMcpCapabilityRow();
  const byId = new Map(input.states.map((s) => [s.id, s]));
  // Legacy desired id during migrate.
  const state = byId.get("mcp:kody") ?? byId.get("harness:kody");
  const desired = state?.desired === true;
  const authOk = state?.authOk === true;
  const installed = state?.installed === true;
  const healthy = state?.healthy === true;
  const mcpUrl = resolveKodyMcpUrl({
    kodyMcpUrl: input.kodyMcpUrl,
    kodyBaseUrl: input.kodyBaseUrl,
  });
  const configured = Boolean(mcpUrl) || authOk;
  let readinessStatus: PeerReadinessStatus = "unknown";
  let readinessHint =
    "Host has not probed Kody MCP (KODY_BASE_URL) yet.";
  if (state) {
    if (configured || authOk) {
      readinessStatus = "ready";
      readinessHint =
        "KODY_BASE_URL set — default plane Studio + Kody injects /mcp.";
    } else {
      readinessStatus = "needs-setup";
      readinessHint =
        "Set KODY_BASE_URL on the Host (→ /mcp), then enable under Settings → MCP tools.";
    }
  } else if (mcpUrl) {
    readinessStatus = "ready";
    readinessHint =
      "KODY_BASE_URL set — default plane Studio + Kody injects /mcp.";
  } else if (input.kodyBaseUrl === "" || input.kodyBaseUrl === null) {
    readinessStatus = "needs-setup";
    readinessHint =
      "Set KODY_BASE_URL on the Host (→ /mcp), then enable under Settings → MCP tools.";
  }

  let action: KodyMcpSettingsCard["action"] = "connect";
  let actionLabel = "Connect (URL)";
  if (!configured) {
    action = "connect";
    actionLabel = "Connect (URL)";
  } else if (!desired) {
    action = "enable";
    actionLabel = "Enable";
  } else {
    action = "ready";
    actionLabel = "In use";
  }

  const planeLabel = mcpPlaneOptionLabel(
    (input.defaultMcpPlane as McpPlaneId) ?? "studio+kody",
  );

  return {
    capabilityId: "mcp:kody",
    label: row?.label ?? "Kody",
    description:
      row?.description ??
      "Kent’s tool plane. Connect it here to add those tools alongside Studio.",
    mcpUrl,
    configured,
    desired,
    authOk,
    healthy,
    readinessStatus,
    readinessHint,
    defaultPlaneLabel: planeLabel,
    action,
    actionLabel,
    detail: state?.detail ?? (mcpUrl ? mcpUrl : undefined),
  };
}
