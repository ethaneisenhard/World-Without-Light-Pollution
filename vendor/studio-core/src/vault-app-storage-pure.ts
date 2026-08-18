/**
 * Global Studio apps — iCloud-style Cloud storage toggles (ADR 0016).
 * These are vault surfaces that sync across projects (not git workspaces).
 * Default: all Cloud On.
 */

export const VAULT_APP_IDS = [
  "notes",
  "media",
  "calendar",
  "messages",
  "roadmap",
  "chats",
  "memory",
] as const;

export type VaultAppId = (typeof VAULT_APP_IDS)[number];

export type VaultAppRow = {
  id: VaultAppId;
  label: string;
  /** One-line what syncs. */
  summary: string;
  /** Switch checked = store on Cloud Host vault. */
  cloudOn: boolean;
  detail: string;
};

export type VaultAppsConfig = Record<VaultAppId, boolean>;

const VAULT_APP_META: Record<
  VaultAppId,
  { label: string; summary: string }
> = {
  notes: {
    label: "Notes",
    summary: "Studio-wide markdown vault (not project git).",
  },
  media: {
    label: "Media",
    summary: "Media library assets across workspaces.",
  },
  calendar: {
    label: "Calendar",
    summary: "Activity calendar / ledger events.",
  },
  messages: {
    label: "Messages",
    summary: "Inbox / message ledger.",
  },
  roadmap: {
    label: "Roadmap",
    summary: "Studio portfolio board (cross-project).",
  },
  chats: {
    label: "Chats",
    summary: "Conversation history in the ledger.",
  },
  memory: {
    label: "Memory",
    summary: "Agent beliefs / prefs graph.",
  },
};

/** Every vault app Cloud On — default product experience. */
export function defaultVaultAppsConfig(): VaultAppsConfig {
  return {
    notes: true,
    media: true,
    calendar: true,
    messages: true,
    roadmap: true,
    chats: true,
    memory: true,
  };
}

export function isVaultAppId(raw: unknown): raw is VaultAppId {
  return (
    typeof raw === "string" &&
    (VAULT_APP_IDS as readonly string[]).includes(raw)
  );
}

export function parseVaultAppsConfig(raw: unknown): VaultAppsConfig {
  const base = defaultVaultAppsConfig();
  if (!raw || typeof raw !== "object") return base;
  const rec = raw as Record<string, unknown>;
  for (const id of VAULT_APP_IDS) {
    const v = rec[id];
    if (typeof v === "boolean") {
      base[id] = v;
    } else if (v && typeof v === "object" && "cloud" in v) {
      const cloud = (v as { cloud?: unknown }).cloud;
      if (typeof cloud === "boolean") base[id] = cloud;
    }
  }
  return base;
}

export function vaultAppCloudOn(
  config: VaultAppsConfig | null | undefined,
  id: VaultAppId,
): boolean {
  const c = config ?? defaultVaultAppsConfig();
  return c[id] !== false;
}

export function vaultAppDetail(cloudOn: boolean): string {
  return cloudOn
    ? "Cloud — uses cloud even if Local is selected"
    : "This computer only — not the cloud vault";
}

export function buildVaultAppStorageRows(
  config: VaultAppsConfig | null | undefined,
): VaultAppRow[] {
  const c = parseVaultAppsConfig(config);
  return VAULT_APP_IDS.map((id) => {
    const cloudOn = c[id] !== false;
    const meta = VAULT_APP_META[id];
    return {
      id,
      label: meta.label,
      summary: meta.summary,
      cloudOn,
      detail: vaultAppDetail(cloudOn),
    };
  });
}

export function applyVaultAppToggleOptimistic(
  rows: readonly VaultAppRow[],
  id: VaultAppId,
  cloudOn: boolean,
): VaultAppRow[] {
  return rows.map((r) =>
    r.id === id
      ? { ...r, cloudOn, detail: vaultAppDetail(cloudOn) }
      : r,
  );
}

/** Patch fragment for studio config. */
export function vaultAppStoragePatch(
  id: VaultAppId,
  cloudOn: boolean,
): { vaultApps: Partial<VaultAppsConfig> } {
  return { vaultApps: { [id]: cloudOn } };
}

export function vaultAppStorageSectionCopy(): {
  title: string;
  body: string;
} {
  return {
    title: "Studio apps in Cloud",
    body: "On = that app uses the cloud vault automatically — including while Local is selected. Off = this computer only (no pull from cloud). Git workspaces are separate.",
  };
}

/** Worker + client routing cookie — default all Cloud On when absent. */
export const VAULT_APPS_COOKIE = "as_vault_apps";

export function serializeVaultAppsCookieValue(config: VaultAppsConfig): string {
  return VAULT_APP_IDS.map((id) => `${id}:${config[id] ? "1" : "0"}`).join(",");
}

export function parseVaultAppsCookieValue(raw: string | null | undefined): VaultAppsConfig {
  const base = defaultVaultAppsConfig();
  const s = (raw || "").trim();
  if (!s) return base;
  let decoded = s;
  try {
    decoded = decodeURIComponent(s);
  } catch {
    decoded = s;
  }
  for (const part of decoded.split(",")) {
    const split = part.indexOf(":");
    if (split <= 0) continue;
    const id = part.slice(0, split).trim();
    const flag = part.slice(split + 1).trim();
    if (!isVaultAppId(id)) continue;
    if (flag === "0" || flag === "false") base[id] = false;
    else if (flag === "1" || flag === "true") base[id] = true;
  }
  return base;
}

export function readNamedCookie(
  cookieHeader: string | null | undefined,
  name: string,
): string | null {
  if (!cookieHeader || !name) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    if (trimmed.slice(0, eq).trim() !== name) continue;
    return trimmed.slice(eq + 1);
  }
  return null;
}

export function parseVaultAppsCookieHeader(
  cookieHeader: string | null | undefined,
): VaultAppsConfig {
  return parseVaultAppsCookieValue(
    readNamedCookie(cookieHeader, VAULT_APPS_COOKIE),
  );
}

/** `document.cookie` assignment (Path=/). */
export function vaultAppsDocumentCookie(config: VaultAppsConfig): string {
  return `${VAULT_APPS_COOKIE}=${encodeURIComponent(serializeVaultAppsCookieValue(config))}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
