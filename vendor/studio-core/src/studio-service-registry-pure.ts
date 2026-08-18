import { PLATFORM_PRIMARY_GATEWAY_UI_URL } from "./control-plane/gateway-hostname-pure.js";
import { PLATFORM_PRIMARY_VOICE_URL } from "./control-plane/voice-hostname-pure.js";
import {
  PLATFORM_PRIMARY_WORKFLOWS_URL,
} from "./control-plane/workflows-hostname-pure.js";

/**
 * Single declarative registry for Studio-owned services (n8n, Voice, …).
 * Rail rows, Preview links, status titles, and runtime ids derive from this —
 * never fork parallel n8n/voice props in hosts.
 */

export type StudioRailServiceId = "n8n" | "voice" | "litellm";

export type StudioServiceDef = {
  id: StudioRailServiceId;
  /** Short name for status / context menu ("n8n", "Voice"). */
  label: string;
  /** Left-rail row label. */
  railLabel: string;
  /** Hosted / public UI base — Open when Cloud Host (default). */
  defaultUrl: string;
  /**
   * Operator-machine UI — Open when Local Host (n8n `:5678`, Voice Pipecat).
   * Absent → same as `defaultUrl`. Prefer `launchPath` when set.
   */
  localUrl?: string;
  /**
   * Local Host only — Studio `/voice` (Pipecat launch).
   * Cloud Host uses `defaultUrl` (hosted Voice; SSO on that origin).
   */
  launchPath?: string;
  /** Include in Preview menu when URL is non-empty. */
  preview: boolean;
  /** Order among services (rail + preview). */
  order: number;
  /**
   * Must spawn + probe on the operator machine (loopback mic/daemon).
   * Cloud Host Run starts a process on the Host box — green light lies for Open.
   */
  requiresLocalHost?: boolean;
  /**
   * Browser health probe for local truth (overrides Host ledger when set).
   * Voice Pipecat bridge :4415 (legacy Node :4410 via ?voiceEngine=legacy).
   */
  localHealthUrl?: string;
};

export const STUDIO_SERVICE_DEFS: Readonly<
  Record<StudioRailServiceId, StudioServiceDef>
> = {
  n8n: {
    id: "n8n",
    label: "n8n",
    railLabel: "n8n - Workflows",
    /** Primary dogfood shell auth → workflows.auth; Host live URL overrides. */
    defaultUrl: PLATFORM_PRIMARY_WORKFLOWS_URL,
    /** Local Host Open — `pnpm dev` n8n. */
    localUrl: "http://127.0.0.1:5678",
    preview: true,
    order: 10,
  },
  voice: {
    id: "voice",
    label: "Voice",
    railLabel: "Voice",
    /** Cloud Host → hosted Voice (`voice.{slug}`). */
    defaultUrl: `${PLATFORM_PRIMARY_VOICE_URL}/`,
    /** Local Host fallback if launchPath unused — Pipecat WebRTC mic UI. */
    localUrl: "http://127.0.0.1:7860/client",
    launchPath: "/voice",
    preview: true,
    order: 20,
    /**
     * Until hosted daemon is always-on (Wave D 17–18), Voice Run/probe is
     * operator-machine loopback. Cloud Host Run would false-green Open.
     */
    requiresLocalHost: true,
    localHealthUrl: "http://127.0.0.1:4415/health",
  },
  litellm: {
    id: "litellm",
    label: "LiteLLM",
    railLabel: "LiteLLM",
    /** Cloud Admin UI — `gateway.{slug}.glassboxcomputer.site/ui`. */
    defaultUrl: PLATFORM_PRIMARY_GATEWAY_UI_URL,
    /** Local compose (`pnpm litellm:dev`). */
    localUrl: "http://127.0.0.1:4000/ui",
    preview: true,
    order: 30,
    localHealthUrl: "http://127.0.0.1:4000/health",
  },
};

/** Stable ordered service ids (by `order`). */
export function listStudioServiceIds(): StudioRailServiceId[] {
  return (Object.keys(STUDIO_SERVICE_DEFS) as StudioRailServiceId[]).sort(
    (a, b) => STUDIO_SERVICE_DEFS[a].order - STUDIO_SERVICE_DEFS[b].order,
  );
}

export function getStudioServiceDef(
  id: string,
): StudioServiceDef | null {
  if (id in STUDIO_SERVICE_DEFS) {
    return STUDIO_SERVICE_DEFS[id as StudioRailServiceId];
  }
  return null;
}

export function isStudioRailServiceId(id: string): id is StudioRailServiceId {
  return id in STUDIO_SERVICE_DEFS;
}

/** Default URL map for Preview / rail when host does not override. */
export function defaultStudioServiceUrls(): Record<
  StudioRailServiceId,
  string
> {
  const out = {} as Record<StudioRailServiceId, string>;
  for (const id of listStudioServiceIds()) {
    const def = STUDIO_SERVICE_DEFS[id];
    out[id] = def.defaultUrl.replace(/\/+$/, "");
  }
  return out;
}

/** True when URL host is operator-machine loopback (not browser-reachable remotely). */
export function isStudioServiceLoopbackUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "127.0.0.1" || host === "localhost" || host === "[::1]";
  } catch {
    return false;
  }
}

/** Topbar Host attach — `laptop` / `local` = Local Host; else Cloud Host. */
export function isStudioLocalHostAttach(
  hostId: string | null | undefined,
): boolean {
  const h = (hostId ?? "").trim().toLowerCase();
  return h === "laptop" || h === "local";
}

/**
 * Open / Preview href for a Studio service.
 *
 * One rule with the topbar Host switch:
 * - **Local Host** + `launchPath` → Studio `/voice` (laptop Pipecat)
 * - **Local Host** + `localUrl` → laptop UI; loopback live OK
 * - **Cloud Host** (default) → hosted `defaultUrl`; Host ledger loopback ignored
 *
 * Mic daemon Cloud/Local follows topbar Host (Voice modal Host toggle = same cutover).
 */
export function resolveStudioServiceOpenUrl(input: {
  serviceId: string;
  liveUrl?: string | null;
  /** Shell attach id (`desk` | `laptop`). Omit → Cloud Host. */
  hostId?: string | null;
}): string | null {
  const def = getStudioServiceDef(input.serviceId);
  if (!def) return null;
  const launch = def.launchPath?.trim() || "";
  const defaultUrl = def.defaultUrl.replace(/\/+$/, "");
  const localUrl = def.localUrl?.trim().replace(/\/+$/, "") || "";
  const live = input.liveUrl?.trim().replace(/\/+$/, "") || "";
  const localAttach = isStudioLocalHostAttach(input.hostId);

  if (launch && localAttach) return launch;

  if (localAttach && localUrl) {
    if (live && isStudioServiceLoopbackUrl(live)) return live;
    return localUrl;
  }

  if (live) {
    if (
      isStudioServiceLoopbackUrl(live) &&
      !isStudioServiceLoopbackUrl(defaultUrl)
    ) {
      return defaultUrl;
    }
    return live;
  }
  return defaultUrl;
}

/** Merge live service urls over registry defaults (Preview menu + rail). */
export function projectStudioServiceUrls(
  liveUrls?: Partial<Record<string, string | null | undefined>> | null,
  hostId?: string | null,
): Record<StudioRailServiceId, string> {
  const out = defaultStudioServiceUrls();
  for (const id of listStudioServiceIds()) {
    const resolved = resolveStudioServiceOpenUrl({
      serviceId: id,
      liveUrl: liveUrls?.[id],
      hostId,
    });
    if (resolved) out[id] = resolved;
  }
  return out;
}

export function studioServiceRequiresLocalHost(id: string): boolean {
  return Boolean(getStudioServiceDef(id)?.requiresLocalHost);
}

/**
 * Block Cloud Host Run/Stop for loopback-only services.
 * `hostId` = shell attach id (`laptop` | `desk` | …).
 */
export function studioServiceLocalHostBlockReason(input: {
  serviceId: string;
  hostId: string | null | undefined;
}): string | null {
  if (!studioServiceRequiresLocalHost(input.serviceId)) return null;
  const host = (input.hostId ?? "").trim().toLowerCase();
  if (!host || host === "laptop" || host === "local") return null;
  const label = getStudioServiceDef(input.serviceId)?.label ?? input.serviceId;
  return `${label} runs on your machine (Pipecat :4415 / mic :7860). Switch to Local, then Run again. Cloud only starts a process on the server — Open still hits 127.0.0.1 on your laptop.`;
}

/** Merge Host ledger with browser-local health for loopback services. */
export function reconcileLocalHostServiceStatus(input: {
  serviceId: string;
  hostStatus: string;
  localHealthy: boolean | null;
  /** When set, only reshape while Local Host — Cloud uses Host/hosted truth. */
  hostId?: string | null;
}): string {
  if (!studioServiceRequiresLocalHost(input.serviceId)) {
    return input.hostStatus;
  }
  if (
    input.hostId !== undefined &&
    !isStudioLocalHostAttach(input.hostId)
  ) {
    return input.hostStatus;
  }
  if (input.localHealthy === null) return input.hostStatus;
  if (input.localHealthy) return "running";
  // Host said On but laptop ports dead — paint truth.
  if (
    input.hostStatus === "running" ||
    input.hostStatus === "starting" ||
    input.hostStatus === "error"
  ) {
    return "off";
  }
  return input.hostStatus;
}

/** Whether the browser should probe `localHealthUrl` for this service. */
export function shouldProbeStudioServiceLocalHealth(input: {
  serviceId: string;
  hostId: string | null | undefined;
}): boolean {
  if (!studioServiceRequiresLocalHost(input.serviceId)) return false;
  if (!getStudioServiceDef(input.serviceId)?.localHealthUrl) return false;
  return isStudioLocalHostAttach(input.hostId);
}
