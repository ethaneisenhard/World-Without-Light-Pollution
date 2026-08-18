/**
 * Shell → Host attach projection (ADR 0014 + 0016).
 * One shell attaches one Host (vault SoT). Local Host = offline vault escape.
 * Project compute is per-workspace `compute.placement` — not this switch.
 */

export type HostAttachRole = "desk" | "laptop" | "custom" | "none";

export type HostAttachProjection = {
  role: HostAttachRole;
  /** Short UI label: Cloud Host / Local Host / … */
  label: string;
  /** One-line explanation for Settings / Host Servers. */
  summary: string;
  /** Normalized proxy URL or empty. */
  proxy: string;
  hostname: string;
};

/** Hot-switch target ids for local dogfood shell (Settings + Chat). */
export type ShellAttachTargetId = "desk" | "laptop";

export type ShellAttachTarget = {
  id: ShellAttachTargetId;
  label: string;
  /** Short face for composer pill. */
  face: string;
  proxy: string;
  hint: string;
};

/** Live Cloud Host vanity (ADR 0021) — desk VPS behind api.auth.…site. */
export const DEFAULT_DESK_HOST_PROXY =
  "https://api.auth.glassboxcomputer.site";
export const DEFAULT_LAPTOP_HOST_PROXY = "http://127.0.0.1:3847";

/**
 * @deprecated transitional browserui desk hostname — still classifies as Cloud Host.
 */
export const LEGACY_BROWSERUI_DESK_HOST_PROXY =
  "https://api.desk.browserui.site";

/** Alias of {@link DEFAULT_DESK_HOST_PROXY} (historical FUTURE name). */
export const FUTURE_DESK_HOST_PROXY = DEFAULT_DESK_HOST_PROXY;
/** @deprecated alias of FUTURE_DESK_HOST_PROXY */
export const LEGACY_DESK_HOST_PROXY = FUTURE_DESK_HOST_PROXY;

const DESK_HOST_HINTS = [
  "api.auth.glassboxcomputer.site",
  "studio.glassboxcomputer.com",
  "api.desk.browserui.site",
  "desk.browserui.site",
];

export function normalizeHostProxyUrl(raw: string | null | undefined): string {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return "";
  try {
    return new URL(s).origin;
  } catch {
    return s.replace(/\/$/, "");
  }
}

export function hostProxyHostname(proxy: string): string {
  const p = normalizeHostProxyUrl(proxy);
  if (!p) return "";
  try {
    return new URL(p).hostname;
  } catch {
    return p;
  }
}

export function classifyHostAttachProxy(
  proxyRaw: string | null | undefined,
): HostAttachProjection {
  const proxy = normalizeHostProxyUrl(proxyRaw);
  if (!proxy) {
    return {
      role: "none",
      label: "No cloud",
      summary: "This shell has no cloud or local attach — API routes will fail.",
      proxy: "",
      hostname: "",
    };
  }
  const hostname = hostProxyHostname(proxy);
  const lower = hostname.toLowerCase();

  // Nested vanity: api.{slug}.glassboxcomputer.site (not one-label api.…).
  const apiVanity =
    /^api\.[a-z0-9]([a-z0-9-]{0,46}[a-z0-9])?\.glassboxcomputer\.site$/.test(
      lower,
    );

  if (
    apiVanity ||
    DESK_HOST_HINTS.some((h) => lower === h || lower.endsWith(`.${h}`)) ||
    lower.includes("desk.browserui") ||
    lower === "glassboxcomputer.com" ||
    lower.endsWith(".glassboxcomputer.com")
  ) {
    return {
      role: "desk",
      label: "Cloud",
      summary:
        "Cloud vault (chats, notes, media, calendar). Other shells on cloud share one copy. Where a project runs is separate.",
      proxy,
      hostname,
    };
  }

  if (
    lower === "127.0.0.1" ||
    lower === "localhost" ||
    lower.endsWith(".local") ||
    lower.includes("tailscale") ||
    lower.endsWith(".ts.net")
  ) {
    return {
      role: "laptop",
      label: "Local",
      summary:
        "Offline escape — chats/notes/media here are not cloud data. Use for Tailscale/offline only. Project files on this machine = local compute.",
      proxy,
      hostname,
    };
  }

  return {
    role: "custom",
    label: "Custom",
    summary:
      "Shell attached to this API. You own the contents — leave/join via backup, not sync.",
    proxy,
    hostname,
  };
}

/**
 * Cloud Host catalog URL. `STUDIO_API_PROXY` / boot hint may be Local Host
 * (`AS_LOCAL_HOST=1`) — never collapse Cloud onto :3847 or the switcher is a no-op.
 */
export function resolveDeskAttachProxyHint(
  hint?: string | null,
): string {
  const n = normalizeHostProxyUrl(hint);
  if (!n) return DEFAULT_DESK_HOST_PROXY;
  const role = classifyHostAttachProxy(n).role;
  switch (role) {
    case "laptop":
    case "none":
      return DEFAULT_DESK_HOST_PROXY;
    case "desk":
    case "custom":
      return n;
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}

/** Catalog for Settings / Chat Host select (local shell hot switch). */
export function listShellAttachTargets(input?: {
  deskProxy?: string | null;
  laptopProxy?: string | null;
}): ShellAttachTarget[] {
  const desk = resolveDeskAttachProxyHint(input?.deskProxy);
  const laptop = normalizeHostProxyUrl(
    input?.laptopProxy || DEFAULT_LAPTOP_HOST_PROXY,
  );
  return [
    {
      id: "desk",
      label: "Cloud",
      face: "Cloud",
      proxy: desk,
      hint: "Cloud vault — chats, notes, media, calendar (same as Studio in the cloud).",
    },
    {
      id: "laptop",
      label: "Local",
      face: "Local",
      proxy: laptop,
      hint: "This computer only — not cloud data. Prefer Cloud day-to-day.",
    },
  ];
}

export function shellAttachTargetIdForProxy(
  proxyRaw: string | null | undefined,
  targets: readonly ShellAttachTarget[] = listShellAttachTargets(),
): ShellAttachTargetId | "custom" | "none" {
  const proxy = normalizeHostProxyUrl(proxyRaw);
  if (!proxy) return "none";
  const role = classifyHostAttachProxy(proxy).role;
  switch (role) {
    case "none":
      return "none";
    case "laptop":
      return "laptop";
    case "desk":
      return "desk";
    case "custom":
      break;
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
  for (const t of targets) {
    if (normalizeHostProxyUrl(t.proxy) === proxy) return t.id;
  }
  return "custom";
}

export function proxyForShellAttachTargetId(
  id: string,
  targets: readonly ShellAttachTarget[] = listShellAttachTargets(),
): string | null {
  const row = targets.find((t) => t.id === id);
  return row ? row.proxy : null;
}

function isLoopbackHostname(raw: string): boolean {
  const h = (raw || "").trim().toLowerCase().split(":")[0] ?? "";
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h === "::1";
}

/** Local wrangler dogfood only — not tenant Cloud shells. */
export function shellAttachHotSwitchAllowed(input: {
  shellHostname: string;
  requestHostname?: string;
  originOrReferer?: string;
  /** Platform tenant route already owns attach. */
  hasTenantRoute?: boolean;
}): boolean {
  if (input.hasTenantRoute) return false;
  if (isLoopbackHostname(input.shellHostname)) return true;
  if (input.requestHostname && isLoopbackHostname(input.requestHostname)) {
    return true;
  }
  const ref = (input.originOrReferer || "").trim();
  if (ref) {
    try {
      if (isLoopbackHostname(new URL(ref).hostname)) return true;
    } catch {
      /* ignore */
    }
  }
  return false;
}

export function isAllowlistedShellAttachProxy(
  proxyRaw: string | null | undefined,
  targets: readonly ShellAttachTarget[] = listShellAttachTargets(),
): boolean {
  const proxy = normalizeHostProxyUrl(proxyRaw);
  if (!proxy) return false;
  return targets.some((t) => normalizeHostProxyUrl(t.proxy) === proxy);
}

export type ParseShellAttachBodyResult =
  | { ok: true; targetId: ShellAttachTargetId; proxy: string }
  | { ok: false; error: string };

/** Parse POST /api/shell/attach JSON body. */
export function parseShellAttachBody(
  body: unknown,
  targets: readonly ShellAttachTarget[] = listShellAttachTargets(),
): ParseShellAttachBodyResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Expected JSON body with targetId" };
  }
  const rec = body as Record<string, unknown>;
  const targetId =
    typeof rec.targetId === "string" ? rec.targetId.trim() : "";
  if (targetId === "desk" || targetId === "laptop") {
    const proxy = proxyForShellAttachTargetId(targetId, targets);
    if (!proxy) return { ok: false, error: `Unknown targetId: ${targetId}` };
    return { ok: true, targetId, proxy };
  }
  if (typeof rec.proxy === "string" && rec.proxy.trim()) {
    const proxy = normalizeHostProxyUrl(rec.proxy);
    if (!isAllowlistedShellAttachProxy(proxy, targets)) {
      return {
        ok: false,
        error: "proxy not in allowlist (desk or laptop only)",
      };
    }
    const id = shellAttachTargetIdForProxy(proxy, targets);
    if (id !== "desk" && id !== "laptop") {
      return { ok: false, error: "proxy not in allowlist" };
    }
    return { ok: true, targetId: id, proxy };
  }
  return { ok: false, error: "Provide targetId: desk | laptop" };
}

/** True when two shells can usefully run at once on different Hosts. */
export function dualShellHostModelOk(): true {
  return true;
}

/**
 * Agent-facing Host lines for chat system context.
 * Stops “local Studio host” answers when the process path is a cloud Host box.
 */
export function formatHostIdentityChatLines(
  projection: HostAttachProjection,
): string[] {
  if (projection.role === "desk") {
    const api = projection.proxy || DEFAULT_DESK_HOST_PROXY;
    return [
      `- Studio place: Cloud`,
      `- Cloud API: ${api}`,
      `When the user asks which place / where you run: answer "cloud". Do NOT say "local", "this computer", "not cloud", or "laptop" — a path like /opt/glassbox-studio is the cloud filesystem, not the user's machine.`,
    ];
  }
  if (projection.role === "laptop") {
    const api = projection.proxy || DEFAULT_LAPTOP_HOST_PROXY;
    return [
      `- Studio place: Local`,
      `- Local API: ${api}`,
      `When the user asks which place / where you run: answer "local" (this computer or Tailnet). Not cloud.`,
    ];
  }
  if (projection.role === "custom" && projection.proxy) {
    return [
      `- Studio place: custom (${projection.hostname || projection.proxy})`,
      `- API: ${projection.proxy}`,
      `When the user asks which place: name this custom API — not "local" unless it is loopback/Tailnet.`,
    ];
  }
  return [];
}

/** Spoken one-liner for chips / short answers. */
export function hostSpokenAnswer(projection: HostAttachProjection): string {
  if (projection.role === "desk") return "Cloud";
  if (projection.role === "laptop") return "Local";
  if (projection.role === "custom") {
    return projection.hostname || projection.label || "custom";
  }
  return "none";
}

/**
 * Host process self-identity (server). Prefer explicit role / public URL /
 * desk domain env — never invent "local" from a filesystem path alone.
 */
export function classifyHostSelfIdentity(input: {
  roleEnv?: string | null;
  publicUrl?: string | null;
  deskDomain?: string | null;
}): HostAttachProjection {
  const role = (input.roleEnv || "").trim().toLowerCase();
  if (
    role === "desk" ||
    role === "cloud" ||
    role === "hosted" ||
    role === "cloud-hosting"
  ) {
    return classifyHostAttachProxy(DEFAULT_DESK_HOST_PROXY);
  }
  if (role === "laptop" || role === "local" || role === "tailnet") {
    return classifyHostAttachProxy(DEFAULT_LAPTOP_HOST_PROXY);
  }
  const publicUrl = (input.publicUrl || "").trim();
  if (publicUrl) {
    const fromUrl = classifyHostAttachProxy(publicUrl);
    if (fromUrl.role !== "none") return fromUrl;
  }
  const deskDomain = (input.deskDomain || "").trim().toLowerCase();
  if (deskDomain) {
    return classifyHostAttachProxy(`https://api.${deskDomain}`);
  }
  return {
    role: "none",
    label: "No cloud",
    summary: "Cloud / local identity unset.",
    proxy: "",
    hostname: "",
  };
}

/** Append Host identity lines when the client context omitted them. */
export function ensureHostIdentityInChatContext(
  context: string,
  projection: HostAttachProjection,
): string {
  const base = typeof context === "string" ? context : "";
  if (/Studio (Host|place):/i.test(base)) return base;
  const lines = formatHostIdentityChatLines(projection);
  if (!lines.length) return base;
  const block = lines.join("\n");
  return base.trim() ? `${base.trim()}\n${block}` : block;
}

/**
 * Shell page → Host attach for chat context (client).
 * Prefer live attach proxy; cloud shell hostnames default to Desk.
 */
export function classifyShellPageHostAttach(input: {
  attachProxy?: string | null;
  attachTargetId?: string | null;
  shellHostname?: string | null;
}): HostAttachProjection {
  const proxy = (input.attachProxy || "").trim();
  if (proxy) return classifyHostAttachProxy(proxy);
  const id = (input.attachTargetId || "").trim().toLowerCase();
  if (id === "desk") return classifyHostAttachProxy(DEFAULT_DESK_HOST_PROXY);
  if (id === "laptop") {
    return classifyHostAttachProxy(DEFAULT_LAPTOP_HOST_PROXY);
  }
  const host = (input.shellHostname || "").trim().toLowerCase().split(":")[0] ?? "";
  if (
    host.endsWith("browserui.site") ||
    host.endsWith("workers.dev") ||
    host.endsWith("glassboxcomputer.site") ||
    host.endsWith("glassboxcomputer.com") ||
    host.includes("desk.browserui")
  ) {
    return classifyHostAttachProxy(DEFAULT_DESK_HOST_PROXY);
  }
  return {
    role: "none",
    label: "No cloud",
    summary: "Cloud / local not resolved yet.",
    proxy: "",
    hostname: "",
  };
}
