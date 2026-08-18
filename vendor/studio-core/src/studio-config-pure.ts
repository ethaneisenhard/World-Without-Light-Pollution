/**
 * ~/.glassbox-studio/config.json — schema, defaults, merge/patch.
 */

import type { AccessMode } from "./access-mode-pure.js";
import { parseAccessMode } from "./access-mode-pure.js";
import {
  defaultDurableConfig,
  parseDurableConfig,
  type DurableConfig,
} from "./durable-runtime-registry-pure.js";
import type { VaultAppsConfig } from "./vault-app-storage-pure.js";
import {
  defaultVaultAppsConfig,
  parseVaultAppsConfig,
} from "./vault-app-storage-pure.js";
import {
  defaultStudioSecurityConfig,
  mergeStudioSecurityPatch,
  parseStudioSecurityConfig,
  type StudioSecurityConfig,
} from "./nope-policy-pure.js";
import type { ChatComposerMode } from "./chat-mode-pure.js";
import { parseChatComposerMode } from "./chat-mode-pure.js";
import { coerceMcpPlaneId } from "./mcp-plane-pure.js";
import {
  DEFAULT_CHAT_RESPONSE_STYLE,
  parseChatResponseStyle,
  type ChatResponseStyle,
} from "./chat-response-style-pure.js";
import {
  DEFAULT_STUDIO_FLEET_CONFIG,
  parseStudioFleetConfig,
  type StudioFleetConfig,
} from "./fleet-config-pure.js";
import {
  AGENT_ROOM_HARNESS_ID,
  isAgentRoomHarnessId,
  parseMultiAgentSetting,
  type MultiAgentSetting,
} from "./agent-room-id-pure.js";
import { PLATFORM_PRIMARY_WORKFLOWS_URL } from "./control-plane/workflows-hostname-pure.js";
import {
  defaultGlobalFileAccess,
  mergeGlobalFileAccessPatch,
  parseGlobalFileAccess,
  type GlobalFileAccessConfig,
} from "./global-file-access-pure.js";
import type { EditorAppId } from "./editor-pure.js";
import type { ToolActionId } from "./tool-catalog-pure.js";
import { STUDIO_TOOL_CATALOG } from "./tool-catalog-pure.js";
import {
  defaultStartupPreference,
  parseStartupPreference,
  type StartupPreference,
} from "./startup-preference-pure.js";
import {
  parseWindowColorOverrides,
  type WindowColorOverrides,
} from "./window-colors-pure.js";
import {
  DEFAULT_SHELL_LAYOUT,
  parseStudioShellLayout,
  type StudioShellLayoutConfig,
} from "./shell-layout-pure.js";
import {
  parseProjectDesignPet,
  parseProjectDesignShell,
  type ProjectDesignPet,
  type ProjectDesignShell,
} from "./design-pure.js";
import {
  parseMobileDockConfig,
  type MobileDockConfig,
} from "./mobile-dock-pure.js";
import {
  emptyHomeConfig,
  parseStudioHomeConfig,
  type StudioHomeConfig,
} from "./home-widgets-pure.js";
import {
  defaultStudioNotificationsConfig,
  mergeNotificationsConfigPatch,
  parseStudioNotificationsConfig,
  type StudioNotificationsConfig,
} from "./notification-prefs-pure.js";
import {
  parsePrefsInjectPolicy,
  type PrefsInjectPolicy,
} from "./memory-prefs-policy-pure.js";
import {
  parseMemoryAutonomyDial,
  type MemoryAutonomyDial,
} from "./memory-autonomy-pure.js";
import {
  defaultStudioBootSplashConfig,
  parseStudioBootSplashConfig,
  type StudioBootSplashConfig,
} from "./boot-splash-pure.js";

export type StudioColorMode = "light" | "dark" | "system";

/**
 * Workspace hop desk policy.
 * `restore-tabs` — per-project open-set / focus (bag + DeskPane WM).
 * `context-only` — keep DeskPane tabs; hop project + shell/chat theme only.
 */
export type WorkspaceSwitchMode = "restore-tabs" | "context-only";

export function parseWorkspaceSwitchMode(
  raw: unknown,
): WorkspaceSwitchMode {
  if (raw === "context-only") return "context-only";
  return "restore-tabs";
}

/**
 * Host PATCH echo can omit newer `ui.*` keys (older desk image).
 * Keep local appearance policy unless this patch explicitly cleared it.
 */
export function mergeStudioConfigHostEcho(
  prev: StudioConfig | null | undefined,
  hostRaw: unknown,
  patch: unknown,
): StudioConfig {
  const fromHost = parseStudioConfig(hostRaw ?? {});
  if (!prev) return fromHost;
  const uiPatch = isRecord(patch) && isRecord(patch.ui) ? patch.ui : null;
  const next = structuredClone(fromHost) as StudioConfig;
  // Patch asked for on — Host omitted → keep on.
  if (
    uiPatch?.forceGlobalAppearance === true &&
    next.ui.forceGlobalAppearance !== true
  ) {
    next.ui.forceGlobalAppearance = true;
  } else if (
    prev.ui.forceGlobalAppearance === true &&
    next.ui.forceGlobalAppearance !== true &&
    uiPatch?.forceGlobalAppearance === undefined
  ) {
    // Unrelated patch (shell/pet) — don't wipe an existing on.
    next.ui.forceGlobalAppearance = true;
  }
  if (
    uiPatch?.workspaceSwitchMode === "context-only" &&
    next.ui.workspaceSwitchMode !== "context-only"
  ) {
    next.ui.workspaceSwitchMode = "context-only";
  } else if (
    prev.ui.workspaceSwitchMode === "context-only" &&
    next.ui.workspaceSwitchMode !== "context-only" &&
    uiPatch?.workspaceSwitchMode === undefined
  ) {
    next.ui.workspaceSwitchMode = "context-only";
  }
  // Older Host may omit selfHealErrors — keep local pref.
  if (
    uiPatch?.selfHealErrors === undefined &&
    prev.ui.selfHealErrors === true &&
    next.ui.selfHealErrors !== true
  ) {
    next.ui.selfHealErrors = true;
  } else if (
    uiPatch?.selfHealErrors === true &&
    next.ui.selfHealErrors !== true
  ) {
    next.ui.selfHealErrors = true;
  }
  // Older Host may omit bootSplash — keep local custom splash.
  if (
    uiPatch?.bootSplash === undefined &&
    prev.ui.bootSplash &&
    (!next.ui.bootSplash || next.ui.bootSplash.paletteId === "system")
  ) {
    const prevId = prev.ui.bootSplash.paletteId;
    if (prevId !== "system" || prev.ui.bootSplash.params) {
      next.ui.bootSplash = structuredClone(prev.ui.bootSplash);
    }
  }
  return next;
}

/** Max length for Settings → Profile display name. */
export const STUDIO_DISPLAY_NAME_MAX_LEN = 48;

/** Trim + cap operator display name; empty → "". */
export function normalizeStudioDisplayName(
  name: string | null | undefined,
): string {
  if (name == null || typeof name !== "string") return "";
  return name.trim().slice(0, STUDIO_DISPLAY_NAME_MAX_LEN);
}

export type StudioMcpServerKind = "http" | "stdio";

/** Hermes-shaped MCP client auth on a server row. */
export type StudioMcpServerAuthKind = "none" | "bearer-env" | "oauth";

export type StudioMcpServerToolsConfig = {
  /** When set, only these tool names (exact) are exposed. */
  include?: string[];
  /** Drop these names when include is absent (include wins when both set). */
  exclude?: string[];
  resources?: boolean;
  prompts?: boolean;
};

export type StudioMcpServerConfig = {
  id: string;
  kind: StudioMcpServerKind;
  enabled: boolean;
  /** HTTP MCP base URL (no trailing slash). */
  url?: string;
  /** stdio command + args (JSON-RPC over stdin/stdout). */
  command?: string;
  args?: string[];
  label?: string;
  /**
   * Env var whose value is sent as `Authorization: Bearer …`
   * (e.g. N8N_MCP_TOKEN for n8n-local).
   */
  authHeaderEnv?: string;
  /**
   * Explicit auth mode (Hermes `auth: oauth` parity).
   * When omitted, derived via {@link resolveMcpServerAuthKind}.
   */
  auth?: StudioMcpServerAuthKind;
  /** Per-server tool filter (Hermes `tools.include` / `exclude`). */
  tools?: StudioMcpServerToolsConfig;
};

/** Derive auth kind when `auth` field omitted. */
export function resolveMcpServerAuthKind(
  server: Pick<StudioMcpServerConfig, "auth" | "authHeaderEnv">,
): StudioMcpServerAuthKind {
  if (server.auth === "oauth" || server.auth === "bearer-env" || server.auth === "none") {
    return server.auth;
  }
  if (server.authHeaderEnv?.trim()) return "bearer-env";
  return "none";
}

function parseMcpServerAuth(raw: unknown): StudioMcpServerAuthKind | undefined {
  if (raw === "none" || raw === "bearer-env" || raw === "oauth") return raw;
  return undefined;
}

function parseMcpServerTools(raw: unknown): StudioMcpServerToolsConfig | undefined {
  if (!isRecord(raw)) return undefined;
  const include = Array.isArray(raw.include)
    ? raw.include.filter((a): a is string => typeof a === "string" && a.trim().length > 0)
        .map((s) => s.trim())
    : undefined;
  const exclude = Array.isArray(raw.exclude)
    ? raw.exclude.filter((a): a is string => typeof a === "string" && a.trim().length > 0)
        .map((s) => s.trim())
    : undefined;
  const out: StudioMcpServerToolsConfig = {};
  if (include?.length) out.include = include;
  if (exclude?.length) out.exclude = exclude;
  if (typeof raw.resources === "boolean") out.resources = raw.resources;
  if (typeof raw.prompts === "boolean") out.prompts = raw.prompts;
  return Object.keys(out).length ? out : undefined;
}

export type StudioProviderConfig = {
  plugin?: string;
  scope?: "studio" | "project";
};

export type StudioMemoryConfig = {
  /** Default memory provider (`studio` graph). Import projectors later. */
  provider: "studio" | "letta" | "hermes";
  /**
   * Which prefs may inject into turns (Wave 6).
   * `studio_and_project` = Global prefs always + project prefs in project chat.
   */
  prefsInject: PrefsInjectPolicy;
  /**
   * Autonomy dial — default staged_only (Approve required).
   * `auto_low_risk` promotes staged prefs (pref:… / pinned studio) to active.
   */
  autonomy: MemoryAutonomyDial;
  /** When true, chat may auto-forge skills from tool trails (default false). */
  autoFromTrace: boolean;
};

export type StudioNotesConfig = {
  /**
   * Legacy studio vault override (`~/…` or absolute).
   * When set, used as studio-wide notes root instead of `studioRoot`.
   */
  vault: string;
  /** Studio-wide notes root (folders of `.md`). */
  studioRoot: string;
  /** Per-project relative notes dir. */
  projectRel: string;
  /** Inject vault search hits into each chat turn when a vault resolves. */
  injectOnTurn: boolean;
  /** Max notes per turn (1–20). */
  injectLimit: number;
};

export type StudioRoadmapConfig = {
  /** Host portfolio board root (under ~/.glassbox-studio by default). */
  studioRoot: string;
  /** Per-project relative board dir. */
  projectRel: string;
};

export type StudioConfig = {
  version: 1;
  ui: {
    colorMode: StudioColorMode;
    theme: { plugin: string };
    panels: { left: number; right: number };
    /** Shell chrome layout — Chat left/right (Settings → Layout). */
    layout: StudioShellLayoutConfig;
    /** Global canvas window/tab hue overrides (kind → palette hue). */
    windowColors: WindowColorOverrides;
    /**
     * Global Studio shell (no `?project=`) — fillShell / accents from theme.set.
     * Must not write package tokens.json (client rebuild). Undefined → default green.
     */
    shell?: ProjectDesignShell;
    /**
     * When true, Global `ui.shell` + `ui.pet` override every workspace
     * (ignore design.json shell/pet). Settings → Appearance iOS toggle.
     */
    forceGlobalAppearance: boolean;
    /**
     * Workspace hop desk policy (Settings → Appearance).
     * `restore-tabs` — per-project open-set / focus via bag + DeskPane WM (default).
     * `context-only` — keep DeskPane tabs; only hop `?project=` + shell/chat theme.
     */
    workspaceSwitchMode: WorkspaceSwitchMode;
    /** Studio-wide default chat pet (projects may override in design.json). */
    pet: ProjectDesignPet;
    /**
     * Operator display name for empty-chat greeting ("Hi {name} — …").
     * Global profile — not workspace brand.name.
     */
    displayName: string;
    /** Compact mobile dock tabs for global Studio (no project). */
    mobileDock: MobileDockConfig;
    /** Home DeskPane widget layouts (reusable host; default layout id). */
    home: StudioHomeConfig;
    /**
     * Glass Box boot splash — palette + animation params.
     * Default `paletteId: violet` (Settings can pick System → Ink/Noir).
     */
    bootSplash: StudioBootSplashConfig;
    /**
     * When true, caught Studio errors auto-summarize and send to Chat to fix
     * (deduped). Settings → AI. Manual Ask chat still works when false.
     */
    selfHealErrors: boolean;
    /** Orchestrator office — chat filter + harness pet overrides. */
    fleet: StudioFleetConfig;
  };
  editor: { preferred: EditorAppId };
  ai: {
    defaultHarness: string;
    /** Composer model id for defaultHarness (empty → harness fallback). */
    defaultChatModel: string;
    /**
     * MCP plane for peer inject — Studio always; optional Studio + Kody /mcp.
     * Orthogonal to harness (brain) and model (weights).
     */
    defaultMcpPlane: string;
    defaultChatMode: ChatComposerMode;
    /** Guarded = allowlists + approvals; all = full catalog + auto-approve. */
    accessMode: AccessMode;
    /**
     * Global Chat disk roots — Studio monorepo + registered workspaces.
     * Full computer access (`ai.accessMode=all`) also sets NOPE posture off
     * via `studioConfigPatchForAccessMode` — Settings → Security can still override.
     */
    globalFileAccess: GlobalFileAccessConfig;
    /** Studio chat reply length + structure prefs (system prompt). */
    responseStyle: ChatResponseStyle;
    /** Multi-agent substrate for swarm / durable run steps. */
    multiAgent: MultiAgentSetting;
    /**
     * When true, Agent mode may fan out Agent room spawns onto the
     * project room (Cursor-like). Multitask always may spawn when multiAgent on.
     */
    autospawn: boolean;
    /**
     * When true, peer-minimal harnesses also get Memory slice in turn prepare
     * (default false — peers use MCP `memory.*` instead).
     */
    peerMemoryInject: boolean;
    /**
     * Capability plane — desired harness/mcp/skill/integration ids
     * (`harness:anthropic`, `mcp:studio-http`, …). Install / onboard / SKU write here.
     */
    desiredCapabilities: string[];
  };
  mcp: {
    tools: Partial<Record<ToolActionId, boolean>>;
    servers: StudioMcpServerConfig[];
  };
  providers: {
    calendar?: StudioProviderConfig;
    media?: StudioProviderConfig;
    email?: StudioProviderConfig;
    analytics?: StudioProviderConfig;
  };
  /** First paint: destination + windows + split (Settings → Startup). */
  startup: StartupPreference;
  /** Agent Memory (beliefs) — not Notes. */
  memory: StudioMemoryConfig;
  /** Obsidian Notes bridge. */
  notes: StudioNotesConfig;
  /** File-backed kanban / roadmap. */
  roadmap: StudioRoadmapConfig;
  /** Unified notifications — defaults + per-workspace overrides. */
  notifications: StudioNotificationsConfig;
  /** NOPE agent guardrails (Settings → Security). */
  security: StudioSecurityConfig;
  /**
   * DurableRuntime plane (ADR 0013) — substrate + intent fallbacks.
   * Parallel to ai.defaultHarness (interactive chat).
   */
  durable: DurableConfig;
  /**
   * iCloud-style Cloud toggles for global Studio apps (Notes, Media, …).
   * true = Cloud Host vault (default). false = This Mac for that surface.
   */
  vaultApps: VaultAppsConfig;
};

export function defaultStudioConfig(): StudioConfig {
  const tools: Partial<Record<ToolActionId, boolean>> = {};
  for (const t of STUDIO_TOOL_CATALOG) {
    tools[t.id] = true;
  }
  return {
    version: 1,
    ui: {
      colorMode: "system",
      theme: { plugin: "@glassbox-studio/studio-theme-default" },
      panels: { left: 18, right: 22 },
      layout: { ...DEFAULT_SHELL_LAYOUT },
      windowColors: {},
      forceGlobalAppearance: false,
      workspaceSwitchMode: "restore-tabs",
      pet: {},
      displayName: "",
      mobileDock: {},
      home: emptyHomeConfig(),
      bootSplash: defaultStudioBootSplashConfig(),
      selfHealErrors: false,
      fleet: { ...DEFAULT_STUDIO_FLEET_CONFIG, harnessPets: {} },
    },
    editor: { preferred: "cursor" },
    ai: {
      defaultHarness: "cursor",
      defaultChatModel: "cursor-grok-4.5-high-fast",
      /** Kent-shaped default: Studio tools + Kody /mcp when KODY_BASE_URL set. */
      defaultMcpPlane: "studio+kody",
      defaultChatMode: "agent",
      accessMode: "guarded",
      globalFileAccess: defaultGlobalFileAccess(),
      responseStyle: { ...DEFAULT_CHAT_RESPONSE_STYLE },
      multiAgent: AGENT_ROOM_HARNESS_ID,
      autospawn: false,
      peerMemoryInject: false,
      desiredCapabilities: [],
    },
    mcp: {
      tools,
      servers: [
        {
          id: "studio-http",
          kind: "http",
          enabled: true,
          url: "http://127.0.0.1:3847",
          label: "Studio HTTP twin",
        },
        {
          id: "n8n-local",
          kind: "http",
          enabled: true,
          url: `${PLATFORM_PRIMARY_WORKFLOWS_URL}/mcp-server/http`,
          label: "n8n MCP (hosted)",
          authHeaderEnv: "N8N_MCP_TOKEN",
        },
      ],
    },
    providers: {
      calendar: {
        plugin: "@glassbox-studio/calendar-local",
        scope: "studio",
      },
      media: {
        plugin: "@glassbox-studio/media-local",
        scope: "studio",
      },
    },
    startup: defaultStartupPreference(),
    memory: {
      provider: "studio",
      prefsInject: "studio_and_project",
      autonomy: "staged_only",
      autoFromTrace: false,
    },
    notes: {
      vault: "",
      studioRoot: "~/.glassbox-studio/notes",
      projectRel: ".glassbox-studio/notes",
      injectOnTurn: true,
      injectLimit: 6,
    },
    roadmap: {
      studioRoot: "~/.glassbox-studio/roadmap",
      projectRel: ".glassbox-studio/roadmap",
    },
    notifications: defaultStudioNotificationsConfig(),
    security: defaultStudioSecurityConfig(),
    durable: defaultDurableConfig(),
    vaultApps: defaultVaultAppsConfig(),
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Capability plane ids — unknown strings kept; install path filters via catalog. */
function parseDesiredCapabilities(
  raw: unknown,
  fallback: string[],
): string[] {
  if (!Array.isArray(raw)) return [...fallback];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const id = item.trim().slice(0, 128);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function parseColorMode(raw: unknown): StudioColorMode {
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return "system";
}

function parseEditor(raw: unknown): EditorAppId {
  if (raw === "cursor" || raw === "vscode" || raw === "zed") return raw;
  return "cursor";
}

function parseMcpServer(raw: unknown): StudioMcpServerConfig | null {
  if (!isRecord(raw) || typeof raw.id !== "string" || !raw.id.trim()) {
    return null;
  }
  const kind: StudioMcpServerKind = raw.kind === "stdio" ? "stdio" : "http";
  const args = Array.isArray(raw.args)
    ? raw.args.filter((a): a is string => typeof a === "string")
    : undefined;
  const auth = parseMcpServerAuth(raw.auth);
  const tools = parseMcpServerTools(raw.tools);
  return {
    id: raw.id.trim(),
    kind,
    enabled: raw.enabled !== false,
    url: typeof raw.url === "string" ? raw.url : undefined,
    args,
    authHeaderEnv:
      typeof raw.authHeaderEnv === "string" ? raw.authHeaderEnv : undefined,
    command: typeof raw.command === "string" ? raw.command : undefined,
    label: typeof raw.label === "string" ? raw.label : undefined,
    ...(auth != null ? { auth } : {}),
    ...(tools != null ? { tools } : {}),
  };
}

function parseProvider(raw: unknown): StudioProviderConfig | undefined {
  if (!isRecord(raw)) return undefined;
  return {
    plugin: typeof raw.plugin === "string" ? raw.plugin : undefined,
    scope: raw.scope === "project" ? "project" : raw.scope === "studio" ? "studio" : undefined,
  };
}

/** Parse unknown JSON into StudioConfig (fills defaults). */
export function parseStudioConfig(raw: unknown): StudioConfig {
  const base = defaultStudioConfig();
  if (!isRecord(raw)) return base;

  const ui = isRecord(raw.ui) ? raw.ui : {};
  const theme = isRecord(ui.theme) ? ui.theme : {};
  const panels = isRecord(ui.panels) ? ui.panels : {};
  const editor = isRecord(raw.editor) ? raw.editor : {};
  const ai = isRecord(raw.ai) ? raw.ai : {};
  const mcp = isRecord(raw.mcp) ? raw.mcp : {};
  const toolsRaw = isRecord(mcp.tools) ? mcp.tools : {};
  const tools: Partial<Record<ToolActionId, boolean>> = { ...base.mcp.tools };
  for (const t of STUDIO_TOOL_CATALOG) {
    if (typeof toolsRaw[t.id] === "boolean") {
      tools[t.id] = toolsRaw[t.id] as boolean;
    }
  }
  const serversRaw = Array.isArray(mcp.servers) ? mcp.servers : null;
  const parsedServers = serversRaw
    ? serversRaw
        .map(parseMcpServer)
        .filter((s): s is StudioMcpServerConfig => s !== null)
    : [];
  // Keep user servers; fill any missing default ids (n8n-local, studio-http).
  const byId = new Map<string, StudioMcpServerConfig>();
  for (const s of base.mcp.servers) byId.set(s.id, s);
  for (const s of parsedServers) byId.set(s.id, s);
  const servers = [...byId.values()];
  const providersRaw = isRecord(raw.providers) ? raw.providers : {};

  return {
    version: 1,
    ui: {
      colorMode: parseColorMode(ui.colorMode),
      theme: {
        plugin:
          typeof theme.plugin === "string" && theme.plugin.trim()
            ? theme.plugin.trim()
            : base.ui.theme.plugin,
      },
      panels: {
        left:
          typeof panels.left === "number" && Number.isFinite(panels.left)
            ? panels.left
            : base.ui.panels.left,
        right:
          typeof panels.right === "number" && Number.isFinite(panels.right)
            ? panels.right
            : base.ui.panels.right,
      },
      layout: parseStudioShellLayout(ui.layout),
      windowColors: parseWindowColorOverrides(ui.windowColors),
      ...(ui.shell !== undefined
        ? { shell: parseProjectDesignShell(ui.shell) }
        : {}),
      forceGlobalAppearance: ui.forceGlobalAppearance === true,
      workspaceSwitchMode: parseWorkspaceSwitchMode(ui.workspaceSwitchMode),
      pet: parseProjectDesignPet(ui.pet),
      displayName: normalizeStudioDisplayName(
        typeof ui.displayName === "string" ? ui.displayName : "",
      ),
      mobileDock: parseMobileDockConfig(ui.mobileDock),
      home: parseStudioHomeConfig(ui.home),
      bootSplash: parseStudioBootSplashConfig(ui.bootSplash),
      selfHealErrors: ui.selfHealErrors === true,
      fleet: parseStudioFleetConfig(ui.fleet),
    },
    editor: { preferred: parseEditor(editor.preferred) },
    ai: {
      defaultHarness: (() => {
        const rawH =
          typeof ai.defaultHarness === "string" && ai.defaultHarness.trim()
            ? ai.defaultHarness.trim()
            : base.ai.defaultHarness;
        // Agent room = presence (not a harness pick).
        if (isAgentRoomHarnessId(rawH)) return "cursor";
        return rawH === "studio" ? "anthropic" : rawH;
      })(),
      defaultChatMode: parseChatComposerMode(ai.defaultChatMode),
      defaultChatModel: (() => {
        if (typeof ai.defaultChatModel === "string" && ai.defaultChatModel.trim()) {
          return ai.defaultChatModel.trim().slice(0, 128);
        }
        return base.ai.defaultChatModel;
      })(),
      defaultMcpPlane: coerceMcpPlaneId(
        typeof ai.defaultMcpPlane === "string"
          ? ai.defaultMcpPlane
          : base.ai.defaultMcpPlane,
      ),
      accessMode: parseAccessMode(ai.accessMode),
      globalFileAccess: parseGlobalFileAccess(
        ai.globalFileAccess ?? base.ai.globalFileAccess,
      ),
      responseStyle: parseChatResponseStyle(
        ai.responseStyle ?? base.ai.responseStyle,
      ),
      multiAgent: parseMultiAgentSetting(ai.multiAgent),
      autospawn: ai.autospawn === true,
      peerMemoryInject: ai.peerMemoryInject === true,
      desiredCapabilities: parseDesiredCapabilities(
        ai.desiredCapabilities,
        base.ai.desiredCapabilities,
      ),
    },
    mcp: { tools, servers: servers.length ? servers : base.mcp.servers },
    providers: {
      calendar: parseProvider(providersRaw.calendar) ?? base.providers.calendar,
      media: parseProvider(providersRaw.media) ?? base.providers.media,
      email: parseProvider(providersRaw.email) ?? base.providers.email,
      analytics: parseProvider(providersRaw.analytics) ?? base.providers.analytics,
    },
    startup: parseStartupPreference(raw.startup),
    memory: parseMemoryConfig(raw.memory, base.memory),
    notes: parseNotesConfig(raw.notes, base.notes),
    roadmap: parseRoadmapConfig(raw.roadmap, base.roadmap),
    notifications: parseStudioNotificationsConfig(raw.notifications),
    security: parseStudioSecurityConfig(raw.security),
    durable: parseDurableConfig(raw.durable),
    vaultApps: parseVaultAppsConfig(raw.vaultApps ?? base.vaultApps),
  };
}

function parseMemoryConfig(
  raw: unknown,
  fallback: StudioMemoryConfig,
): StudioMemoryConfig {
  if (!isRecord(raw)) return fallback;
  const provider =
    raw.provider === "letta" || raw.provider === "hermes"
      ? raw.provider
      : raw.provider === "studio"
        ? "studio"
        : fallback.provider;
  return {
    provider,
    prefsInject:
      raw.prefsInject !== undefined
        ? parsePrefsInjectPolicy(raw.prefsInject)
        : fallback.prefsInject,
    autonomy:
      raw.autonomy !== undefined
        ? parseMemoryAutonomyDial(raw.autonomy)
        : fallback.autonomy,
    autoFromTrace:
      raw.autoFromTrace !== undefined
        ? raw.autoFromTrace === true
        : fallback.autoFromTrace,
  };
}

function parseNotesConfig(
  raw: unknown,
  fallback: StudioNotesConfig,
): StudioNotesConfig {
  if (!isRecord(raw)) return fallback;
  const injectLimitRaw =
    typeof raw.injectLimit === "number" && Number.isFinite(raw.injectLimit)
      ? Math.round(raw.injectLimit)
      : fallback.injectLimit;
  return {
    vault: typeof raw.vault === "string" ? raw.vault : fallback.vault,
    studioRoot:
      typeof raw.studioRoot === "string" && raw.studioRoot.trim()
        ? raw.studioRoot.trim()
        : fallback.studioRoot,
    projectRel:
      typeof raw.projectRel === "string" && raw.projectRel.trim()
        ? raw.projectRel.trim()
        : fallback.projectRel,
    injectOnTurn:
      typeof raw.injectOnTurn === "boolean"
        ? raw.injectOnTurn
        : fallback.injectOnTurn,
    injectLimit: Math.min(20, Math.max(1, injectLimitRaw)),
  };
}

function parseRoadmapConfig(
  raw: unknown,
  fallback: StudioRoadmapConfig,
): StudioRoadmapConfig {
  if (!isRecord(raw)) return fallback;
  return {
    studioRoot:
      typeof raw.studioRoot === "string" && raw.studioRoot.trim()
        ? raw.studioRoot.trim()
        : fallback.studioRoot,
    projectRel:
      typeof raw.projectRel === "string" && raw.projectRel.trim()
        ? raw.projectRel.trim()
        : fallback.projectRel,
  };
}

/** Deep-merge patch onto config (object fields merge; arrays replace when present). */
export function patchStudioConfig(
  current: StudioConfig,
  patch: unknown,
): StudioConfig {
  if (!isRecord(patch)) return current;
  const next = structuredClone(current) as StudioConfig;
  // Wire/on-disk configs may omit desktop/mobile — normalize before merge.
  next.startup = parseStartupPreference(next.startup);

  if (isRecord(patch.ui)) {
    if (patch.ui.colorMode !== undefined) {
      next.ui.colorMode = parseColorMode(patch.ui.colorMode);
    }
    if (isRecord(patch.ui.theme) && typeof patch.ui.theme.plugin === "string") {
      next.ui.theme.plugin = patch.ui.theme.plugin.trim() || next.ui.theme.plugin;
    }
    if (isRecord(patch.ui.panels)) {
      if (typeof patch.ui.panels.left === "number") {
        next.ui.panels.left = patch.ui.panels.left;
      }
      if (typeof patch.ui.panels.right === "number") {
        next.ui.panels.right = patch.ui.panels.right;
      }
    }
    if (patch.ui.layout !== undefined) {
      next.ui.layout = parseStudioShellLayout({
        ...next.ui.layout,
        ...(isRecord(patch.ui.layout) ? patch.ui.layout : {}),
      });
    }
    if (patch.ui.windowColors !== undefined) {
      next.ui.windowColors = parseWindowColorOverrides(patch.ui.windowColors);
    }
    if (patch.ui.shell !== undefined) {
      if (patch.ui.shell === null) {
        delete next.ui.shell;
      } else {
        const shell = parseProjectDesignShell(patch.ui.shell);
        if (shell) next.ui.shell = shell;
        else delete next.ui.shell;
      }
    }
    if (patch.ui.forceGlobalAppearance !== undefined) {
      next.ui.forceGlobalAppearance = patch.ui.forceGlobalAppearance === true;
    }
    if (patch.ui.workspaceSwitchMode !== undefined) {
      next.ui.workspaceSwitchMode = parseWorkspaceSwitchMode(
        patch.ui.workspaceSwitchMode,
      );
    }
    if (patch.ui.pet !== undefined) {
      next.ui.pet = parseProjectDesignPet(patch.ui.pet);
    }
    if (patch.ui.displayName !== undefined) {
      next.ui.displayName = normalizeStudioDisplayName(
        typeof patch.ui.displayName === "string" ? patch.ui.displayName : "",
      );
    }
    if (patch.ui.mobileDock !== undefined) {
      next.ui.mobileDock = parseMobileDockConfig(patch.ui.mobileDock);
    }
    if (patch.ui.home !== undefined) {
      next.ui.home = parseStudioHomeConfig(patch.ui.home);
    }
    if (patch.ui.bootSplash !== undefined) {
      next.ui.bootSplash = parseStudioBootSplashConfig(patch.ui.bootSplash);
    }
    if (patch.ui.selfHealErrors !== undefined) {
      next.ui.selfHealErrors = patch.ui.selfHealErrors === true;
    }
    if (patch.ui.fleet !== undefined) {
      next.ui.fleet = parseStudioFleetConfig(patch.ui.fleet);
    }
  }
  if (isRecord(patch.editor) && patch.editor.preferred !== undefined) {
    next.editor.preferred = parseEditor(patch.editor.preferred);
  }
  if (isRecord(patch.ai)) {
    if (typeof patch.ai.defaultHarness === "string") {
      const h = patch.ai.defaultHarness.trim() || next.ai.defaultHarness;
      next.ai.defaultHarness =
        isAgentRoomHarnessId(h)
          ? "cursor"
          : h === "studio"
            ? "anthropic"
            : h;
    }
    if (patch.ai.defaultChatMode !== undefined) {
      next.ai.defaultChatMode = parseChatComposerMode(patch.ai.defaultChatMode);
    }
    if (typeof patch.ai.defaultChatModel === "string") {
      const m = patch.ai.defaultChatModel.trim();
      next.ai.defaultChatModel = m ? m.slice(0, 128) : "";
    }
    if (typeof patch.ai.defaultMcpPlane === "string") {
      next.ai.defaultMcpPlane = coerceMcpPlaneId(patch.ai.defaultMcpPlane);
    }
    if (patch.ai.accessMode !== undefined) {
      next.ai.accessMode = parseAccessMode(patch.ai.accessMode);
    }
    if (patch.ai.globalFileAccess !== undefined) {
      next.ai.globalFileAccess = mergeGlobalFileAccessPatch(
        next.ai.globalFileAccess,
        patch.ai.globalFileAccess,
      );
    }
    if (patch.ai.responseStyle !== undefined) {
      next.ai.responseStyle = parseChatResponseStyle({
        ...next.ai.responseStyle,
        ...(isRecord(patch.ai.responseStyle) ? patch.ai.responseStyle : {}),
      });
    }
    if (patch.ai.multiAgent !== undefined) {
      next.ai.multiAgent = parseMultiAgentSetting(patch.ai.multiAgent);
    }
    if (patch.ai.autospawn !== undefined) {
      next.ai.autospawn = patch.ai.autospawn === true;
    }
    if (patch.ai.peerMemoryInject !== undefined) {
      next.ai.peerMemoryInject = patch.ai.peerMemoryInject === true;
    }
    if (patch.ai.desiredCapabilities !== undefined) {
      next.ai.desiredCapabilities = parseDesiredCapabilities(
        patch.ai.desiredCapabilities,
        next.ai.desiredCapabilities,
      );
    }
  }
  if (isRecord(patch.memory)) {
    next.memory = parseMemoryConfig(patch.memory, next.memory);
  }
  if (isRecord(patch.notes)) {
    next.notes = parseNotesConfig(patch.notes, next.notes);
  }
  if (isRecord(patch.roadmap)) {
    next.roadmap = parseRoadmapConfig(patch.roadmap, next.roadmap);
  }
  if (patch.notifications !== undefined) {
    next.notifications = mergeNotificationsConfigPatch(
      next.notifications,
      patch.notifications,
    );
  }
  if (patch.security !== undefined) {
    next.security = mergeStudioSecurityPatch(
      next.security ?? defaultStudioSecurityConfig(),
      patch.security,
    );
  }
  if (patch.durable !== undefined) {
    next.durable = parseDurableConfig({
      ...next.durable,
      ...(isRecord(patch.durable) ? patch.durable : {}),
      fallbacks: {
        ...next.durable.fallbacks,
        ...(isRecord(patch.durable) && isRecord(patch.durable.fallbacks)
          ? patch.durable.fallbacks
          : {}),
      },
    });
  }
  if (isRecord(patch.mcp)) {
    if (isRecord(patch.mcp.tools)) {
      for (const t of STUDIO_TOOL_CATALOG) {
        if (typeof patch.mcp.tools[t.id] === "boolean") {
          next.mcp.tools[t.id] = patch.mcp.tools[t.id] as boolean;
        }
      }
    }
    if (Array.isArray(patch.mcp.servers)) {
      next.mcp.servers = patch.mcp.servers
        .map(parseMcpServer)
        .filter((s): s is StudioMcpServerConfig => s !== null);
    }
  }
  if (isRecord(patch.providers)) {
    for (const key of ["calendar", "media", "email", "analytics"] as const) {
      if (patch.providers[key] !== undefined) {
        next.providers[key] = parseProvider(patch.providers[key]);
      }
    }
  }
  if (patch.startup !== undefined) {
    const startupPatch = isRecord(patch.startup) ? patch.startup : {};
    // Always normalize first — live configs may lack desktop/mobile until re-parse.
    const currentStartup = parseStartupPreference(next.startup);
    const merged: Record<string, unknown> = {
      ...currentStartup,
      ...startupPatch,
      desktop: isRecord(startupPatch.desktop)
        ? { ...currentStartup.desktop, ...startupPatch.desktop }
        : currentStartup.desktop,
      mobile: isRecord(startupPatch.mobile)
        ? { ...currentStartup.mobile, ...startupPatch.mobile }
        : currentStartup.mobile,
    };
    // Legacy flat patches (windows/focusKind/…) update desktop.
    if (
      startupPatch.windows !== undefined ||
      startupPatch.focusKind !== undefined ||
      startupPatch.layoutMode !== undefined ||
      startupPatch.splitPanes !== undefined ||
      startupPatch.leftTab !== undefined
    ) {
      merged.desktop = {
        ...currentStartup.desktop,
        ...(isRecord(merged.desktop) ? merged.desktop : {}),
        ...(startupPatch.windows !== undefined
          ? { windows: startupPatch.windows }
          : {}),
        ...(startupPatch.focusKind !== undefined
          ? { focusKind: startupPatch.focusKind }
          : {}),
        ...(startupPatch.layoutMode !== undefined
          ? { layoutMode: startupPatch.layoutMode }
          : {}),
        ...(startupPatch.splitPanes !== undefined
          ? { splitPanes: startupPatch.splitPanes }
          : {}),
        ...(startupPatch.leftTab !== undefined
          ? { leftTab: startupPatch.leftTab }
          : {}),
      };
    }
    next.startup = parseStartupPreference(merged);
  }
  if (patch.vaultApps !== undefined) {
    next.vaultApps = parseVaultAppsConfig({
      ...next.vaultApps,
      ...(isRecord(patch.vaultApps) ? patch.vaultApps : {}),
    });
  }
  return next;
}

/**
 * Merge localStorage tool settings into config when config tools are all-default
 * and local has any disabled tool.
 */
export function migrateLocalToolSettingsIntoConfig(
  config: StudioConfig,
  localTools: Partial<Record<ToolActionId, boolean>> | null | undefined,
): StudioConfig {
  if (!localTools) return config;
  const hasLocalOverride = STUDIO_TOOL_CATALOG.some(
    (t) => localTools[t.id] === false,
  );
  if (!hasLocalOverride) return config;
  const configAllOn = STUDIO_TOOL_CATALOG.every(
    (t) => config.mcp.tools[t.id] !== false,
  );
  if (!configAllOn) return config;
  return patchStudioConfig(config, { mcp: { tools: localTools } });
}

/** Allowlist for harness from config mcp.tools; null = all. */
export function allowToolsFromStudioConfig(
  config: StudioConfig,
): readonly string[] | null {
  const enabled = STUDIO_TOOL_CATALOG.filter(
    (t) => config.mcp.tools[t.id] !== false,
  ).map((t) => t.id);
  if (enabled.length === STUDIO_TOOL_CATALOG.length) return null;
  return enabled;
}
