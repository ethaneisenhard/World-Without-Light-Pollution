/**
 * Vault vs compute API routing (ADR 0016).
 * Vault routes always stay on the vault Host; compute may delegate by placement.
 */

import type { ComputePlacement } from "./compute-placement-pure.js";
import type { HostAttachRole } from "./host-attach-pure.js";
import {
  vaultAppCloudOn,
  type VaultAppId,
  type VaultAppsConfig,
} from "./vault-app-storage-pure.js";

export type HostApiRouteClass = "vault" | "compute" | "shell" | "unknown";

/** Path prefixes (after /api/) that are vault SoT — never proxy to laptop bridge. */
export const VAULT_API_PREFIXES = [
  "ledger",
  "notes",
  "media",
  "messages",
  "calendar",
  "memory",
  "roadmap",
  "notifications",
  "studio/config",
  "studio/theme",
  "studio/brand",
  "studio/pet",
  "studio/dock",
  "studio/home",
  "studio/window-colors",
  "studio/experience",
  "studio/windows",
  "shell/attach",
  "host",
] as const;

/** Path prefixes that follow project compute placement. */
export const COMPUTE_API_PREFIXES = [
  "files",
  "git",
  "runtimes",
  "services",
  "terminal",
  "deploy",
  "convert",
  "browser",
  "shell/run",
] as const;

function normalizeApiPath(raw: string): string {
  let p = (raw || "").trim();
  if (!p) return "";
  try {
    if (p.startsWith("http://") || p.startsWith("https://")) {
      p = new URL(p).pathname;
    }
  } catch {
    /* keep raw */
  }
  p = p.replace(/\/+/g, "/");
  const q = p.indexOf("?");
  if (q >= 0) p = p.slice(0, q);
  if (p.startsWith("/api/")) p = p.slice("/api/".length);
  else if (p.startsWith("api/")) p = p.slice("api/".length);
  else if (p.startsWith("/")) p = p.slice(1);
  return p.replace(/\/+$/, "");
}

function matchesPrefix(
  path: string,
  prefixes: readonly string[],
): boolean {
  for (const prefix of prefixes) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return true;
  }
  return false;
}

export function classifyHostApiRoute(pathOrUrl: string): HostApiRouteClass {
  const path = normalizeApiPath(pathOrUrl);
  if (!path) return "unknown";
  if (matchesPrefix(path, VAULT_API_PREFIXES)) return "vault";
  if (matchesPrefix(path, COMPUTE_API_PREFIXES)) return "compute";
  if (
    path.startsWith("shell/") ||
    path === "health" ||
    path.startsWith("auth/")
  ) {
    return "shell";
  }
  return "unknown";
}

/** Hard law: vault classification never delegates off the vault Host. */
export function vaultRouteMustStayOnVaultHost(
  pathOrUrl: string,
): boolean {
  return classifyHostApiRoute(pathOrUrl) === "vault";
}

const VAULT_APP_API_PREFIXES: ReadonlyArray<{
  prefix: string;
  id: VaultAppId;
}> = [
  { prefix: "messages", id: "messages" },
  { prefix: "notes", id: "notes" },
  { prefix: "media", id: "media" },
  { prefix: "calendar", id: "calendar" },
  { prefix: "memory", id: "memory" },
  { prefix: "roadmap", id: "roadmap" },
  { prefix: "ledger", id: "chats" },
];

/** Studio app toggle that owns this `/api/…` path — null = follow attach Host. */
export function vaultAppIdForApiPath(pathOrUrl: string): VaultAppId | null {
  const path = normalizeApiPath(pathOrUrl);
  if (!path) return null;
  for (const row of VAULT_APP_API_PREFIXES) {
    if (path === row.prefix || path.startsWith(`${row.prefix}/`)) {
      return row.id;
    }
  }
  return null;
}

function normalizeProxyOrigin(raw: string | null | undefined): string {
  const s = (raw || "").trim();
  if (!s) return "";
  try {
    return new URL(s).origin;
  } catch {
    return s.replace(/\/$/, "");
  }
}

/**
 * Local Host attach still sends Cloud-On vault apps to Cloud Host (ADR 0016).
 * Off = this computer. Compute / Settings config stay on the attach Host.
 */
export function resolveVaultAwareHostProxy(input: {
  path: string;
  attachProxy: string;
  vaultHostProxy: string;
  vaultApps?: VaultAppsConfig | null;
}): string {
  const attach = normalizeProxyOrigin(input.attachProxy);
  const vault = normalizeProxyOrigin(input.vaultHostProxy);
  if (!vault) return attach;
  if (!attach || attach === vault) return vault;
  const appId = vaultAppIdForApiPath(input.path);
  if (!appId) return attach;
  return vaultAppCloudOn(input.vaultApps, appId) ? vault : attach;
}

export type ComputeDelegateTarget =
  | { kind: "vault-host"; reason: string }
  | { kind: "bridge"; bridgeUrl: string; reason: string }
  | { kind: "byo"; hostUrl: string; reason: string }
  | { kind: "unreachable"; reason: string };

export function resolveComputeDelegateTarget(input: {
  routeClass: HostApiRouteClass;
  placement: ComputePlacement;
  /** Reachable laptop / local bridge base URL when placement=local. */
  bridgeUrl?: string | null;
  /** BYO Host API when placement=byo. */
  byoHostUrl?: string | null;
}): ComputeDelegateTarget {
  if (input.routeClass === "vault" || input.routeClass === "shell") {
    return {
      kind: "vault-host",
      reason: "vault_or_shell_stays_on_vault_host",
    };
  }
  if (input.routeClass !== "compute") {
    return { kind: "vault-host", reason: "unknown_route_defaults_to_vault" };
  }
  if (input.placement === "hosted") {
    return { kind: "vault-host", reason: "placement_hosted" };
  }
  if (input.placement === "local") {
    const bridge = (input.bridgeUrl || "").trim().replace(/\/$/, "");
    if (!bridge) {
      return {
        kind: "unreachable",
        reason: "placement_local_bridge_down",
      };
    }
    return {
      kind: "bridge",
      bridgeUrl: bridge,
      reason: "placement_local",
    };
  }
  const byo = (input.byoHostUrl || "").trim().replace(/\/$/, "");
  if (!byo) {
    return { kind: "unreachable", reason: "placement_byo_host_missing" };
  }
  return { kind: "byo", hostUrl: byo, reason: "placement_byo" };
}

/** Settings / chrome: Local Host attach = offline vault, not cloud data. */
export function isOfflineVaultAttach(role: HostAttachRole): boolean {
  return role === "laptop";
}

export function offlineVaultBannerCopy(): {
  title: string;
  body: string;
} {
  return {
    title: "Offline vault (Local)",
    body: "Local is an offline escape. Studio apps still On in Cloud (Messages, Notes, …) keep using the cloud vault — not this computer’s copy. Turn an app Off to keep it here only. Where a project runs is a separate knob.",
  };
}

export function vaultStickySettingsCopy(): {
  title: string;
  body: string;
} {
  return {
    title: "Vault vs compute",
    body: "Cloud holds the vault (chats, notes, media, calendar). Switching to Local is an offline escape — not sync. Where a project runs is a separate choice on that workspace.",
  };
}
