/**
 * studio.nav — validate agent shell navigation commands (client applies URL / Live / file).
 */

import {
  coerceSettingsSection,
  parseSettingsSection,
  type SettingsNavSection,
} from "./settings-nav-pure.js";
import { normalizeLivePreviewPathInput } from "./preview-pure.js";
import { normalizeProjectRelativePath } from "./import-hotlink-pure.js";
import {
  canvasWindowIds,
  type StudioCanvasWindowId,
} from "./canvas-window-registry-pure.js";
import type { ViewMenuItemId } from "./view-menu-pure.js";
import {
  ANALYTICS_NAV_SECTIONS,
  type AnalyticsNavSection,
} from "./nav-studio-panels-pure.js";
import {
  EMAIL_STUDIO_TABS,
  type EmailStudioTab,
} from "./email-studio-pure.js";
import {
  parseDesignStudioSurfaceInput,
  type DesignStudioSurface,
} from "./design-studio-surfaces-pure.js";
import {
  parseMessageHandoffNav,
  type MessageChatHandoff,
} from "./messages-mcp-pure.js";

export type StudioNavRailTab = "nav" | "files" | "ai";

export type StudioNavCommand = {
  kinds: ViewMenuItemId[];
  /** Active window after open (omit on close-only / project|tab-only). */
  focus?: ViewMenuItemId;
  /** Close listed kinds instead of opening. */
  close?: boolean;
  livePath?: string;
  /** Project-relative file to open (Code by default; preferDesign / preferLive). */
  filePath?: string;
  preferDesign?: boolean;
  preferLive?: boolean;
  ssect?: SettingsNavSection;
  asect?: AnalyticsNavSection;
  emailTab?: EmailStudioTab;
  /** Design window surface (`ds=`). */
  ds?: DesignStudioSurface;
  /** Switch workspace (`?project=`). */
  projectId?: string;
  /** Left rail tab. */
  tab?: StudioNavRailTab;
  /** DeskPane layout mode. */
  layout?: "split" | "single";
  splitPanes?: ViewMenuItemId[];
  splitRatio?: number;
  /** Messages → Chat bind (from messages.openInChat). */
  messageHandoff?: MessageChatHandoff;
};

export type StudioNavParseOk = { ok: true; command: StudioNavCommand };
export type StudioNavParseErr = { ok: false; error: string };

/** All canvas DeskPane kinds (registry) — not View-menu-only (includes messages). */
const KIND_SET = new Set<string>(canvasWindowIds());
const ASECT_SET = new Set<string>(ANALYTICS_NAV_SECTIONS.map((s) => s.id));
const EMAIL_TAB_SET = new Set<string>(EMAIL_STUDIO_TABS);
const RAIL_TAB_SET = new Set<string>(["nav", "files", "ai"]);

function asKind(raw: unknown): ViewMenuItemId | null {
  if (typeof raw !== "string") return null;
  const id = raw.trim().toLowerCase();
  return KIND_SET.has(id) ? (id as ViewMenuItemId) : null;
}

/** Pipe-joined ids for tool schemas / agent hints — stays synced with registry. */
export function studioNavKindEnumDescription(): string {
  return canvasWindowIds().join("|");
}

export function studioNavKindIds(): readonly StudioCanvasWindowId[] {
  return canvasWindowIds();
}

function parseKindList(raw: unknown): ViewMenuItemId[] | { error: string } {
  const kindList: unknown[] = Array.isArray(raw)
    ? raw
    : raw !== undefined && raw !== null
      ? [raw]
      : [];
  const kinds: ViewMenuItemId[] = [];
  for (const item of kindList) {
    const k = asKind(item);
    if (!k) {
      return {
        error: `Unknown window kind: ${String(item)}. Use View menu ids (live, code, settings, …).`,
      };
    }
    if (!kinds.includes(k)) kinds.push(k);
  }
  return kinds;
}

/** Normalize Live preview path — leading slash, no host. */
export function normalizeStudioNavLivePath(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (trimmed.includes("..")) return undefined;
  return normalizeLivePreviewPathInput(trimmed);
}

/** Normalize project-relative file path for Code window (no leading slash, no escape). */
export function normalizeStudioNavFilePath(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim().replace(/\\/g, "/").replace(/^\.\//, "");
  if (!trimmed || trimmed.startsWith("/") || trimmed.includes("\0")) {
    return undefined;
  }
  return normalizeProjectRelativePath(trimmed) || undefined;
}

function normalizeProjectId(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const id = raw.trim();
  if (!id || id.length > 128) return undefined;
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(id)) return undefined;
  return id;
}

function normalizeRailTab(raw: unknown): StudioNavRailTab | undefined {
  if (typeof raw !== "string") return undefined;
  const t = raw.trim().toLowerCase();
  return RAIL_TAB_SET.has(t) ? (t as StudioNavRailTab) : undefined;
}

function normalizeLayout(raw: unknown): "split" | "single" | undefined {
  if (typeof raw !== "string") return undefined;
  const v = raw.trim().toLowerCase();
  if (v === "split" || v === "single") return v;
  return undefined;
}

function normalizeSplitRatio(raw: unknown): number | undefined {
  if (typeof raw !== "number" && typeof raw !== "string") return undefined;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(0.8, Math.max(0.2, n));
}

function normalizeAsect(raw: unknown): AnalyticsNavSection | undefined {
  if (typeof raw !== "string") return undefined;
  const id = raw.trim().toLowerCase();
  return ASECT_SET.has(id) ? (id as AnalyticsNavSection) : undefined;
}

function normalizeEmailTab(raw: unknown): EmailStudioTab | undefined {
  if (typeof raw !== "string") return undefined;
  const id = raw.trim().toLowerCase();
  return EMAIL_TAB_SET.has(id) ? (id as EmailStudioTab) : undefined;
}

/**
 * Bare `path` alias: site paths stay live; project files (extension or nested) → filePath.
 */
function disambiguatePathAlias(raw: unknown): {
  livePath?: string;
  filePath?: string;
} {
  if (typeof raw !== "string") return {};
  const trimmed = raw.trim();
  if (!trimmed) return {};
  if (trimmed.startsWith("/")) {
    const livePath = normalizeStudioNavLivePath(trimmed);
    return livePath ? { livePath } : {};
  }
  const looksLikeFile =
    /\.[a-zA-Z0-9]{1,16}$/.test(trimmed) || trimmed.includes("/");
  if (looksLikeFile) {
    const filePath = normalizeStudioNavFilePath(trimmed);
    return filePath ? { filePath } : {};
  }
  const livePath = normalizeStudioNavLivePath(trimmed);
  return livePath ? { livePath } : {};
}

function asBool(raw: unknown): boolean | undefined {
  if (raw === true || raw === false) return raw;
  if (typeof raw === "string") {
    const v = raw.trim().toLowerCase();
    if (v === "true" || v === "1") return true;
    if (v === "false" || v === "0") return false;
  }
  return undefined;
}

/**
 * Parse tools.call / MCP input into a nav command.
 * `kind` may be a string or string[].
 */
export function parseStudioNavInput(
  input: Record<string, unknown>,
): StudioNavParseOk | StudioNavParseErr {
  const close =
    input.close === true ||
    asBool(input.close) === true ||
    (typeof input.action === "string" &&
      input.action.trim().toLowerCase() === "close");

  const kindsResult = parseKindList(input.kind ?? input.kinds);
  if ("error" in kindsResult) return { ok: false, error: kindsResult.error };
  const kinds = [...kindsResult];

  const splitRaw = input.splitPanes ?? input.split;
  let splitPanes: ViewMenuItemId[] | undefined;
  if (splitRaw !== undefined && splitRaw !== null) {
    const asList =
      typeof splitRaw === "string"
        ? splitRaw.split(",").map((s) => s.trim()).filter(Boolean)
        : splitRaw;
    const parsed = parseKindList(asList);
    if ("error" in parsed) {
      return { ok: false, error: `Invalid splitPanes: ${parsed.error}` };
    }
    if (parsed.length < 2) {
      return {
        ok: false,
        error: "splitPanes requires at least two window kinds (e.g. code,live)",
      };
    }
    splitPanes = parsed;
  }

  const layout = normalizeLayout(input.layout);
  if (
    input.layout !== undefined &&
    input.layout !== null &&
    String(input.layout).trim() !== "" &&
    !layout
  ) {
    return { ok: false, error: 'Invalid layout (use "split" or "single")' };
  }

  const splitRatio = normalizeSplitRatio(input.splitRatio);
  if (
    input.splitRatio !== undefined &&
    input.splitRatio !== null &&
    String(input.splitRatio).trim() !== "" &&
    splitRatio === undefined
  ) {
    return { ok: false, error: "Invalid splitRatio (use 0.2–0.8)" };
  }

  const projectId = normalizeProjectId(input.projectId ?? input.project);
  if (
    ((input.projectId !== undefined &&
      input.projectId !== null &&
      String(input.projectId).trim() !== "") ||
      (input.project !== undefined &&
        input.project !== null &&
        String(input.project).trim() !== "")) &&
    !projectId
  ) {
    return { ok: false, error: "Invalid projectId" };
  }

  const tab = normalizeRailTab(input.tab);
  if (
    input.tab !== undefined &&
    input.tab !== null &&
    String(input.tab).trim() !== "" &&
    !tab
  ) {
    return { ok: false, error: 'Invalid tab (use "nav", "files", or "ai")' };
  }

  const filePathEarly = normalizeStudioNavFilePath(
    input.filePath ?? input.codePath,
  );
  let livePathEarly = normalizeStudioNavLivePath(input.livePath);
  let filePath = filePathEarly;

  if (
    !livePathEarly &&
    !filePath &&
    input.path !== undefined &&
    input.path !== null &&
    String(input.path).trim() !== ""
  ) {
    const alias = disambiguatePathAlias(input.path);
    livePathEarly = alias.livePath;
    filePath = alias.filePath;
  }

  const preferDesign = asBool(input.preferDesign) === true;
  const preferLive = asBool(input.preferLive) === true;

  const hasShellOnly = Boolean(projectId || tab || layout || splitPanes);
  const hasSectionIntent = Boolean(
    (input.ssect != null && String(input.ssect).trim() !== "") ||
      (input.asect != null && String(input.asect).trim() !== "") ||
      (input.emailTab != null && String(input.emailTab).trim() !== "") ||
      (input.ds != null && String(input.ds).trim() !== "") ||
      (input.designSurface != null && String(input.designSurface).trim() !== "") ||
      (input.surface != null && String(input.surface).trim() !== ""),
  );
  if (
    kinds.length === 0 &&
    !livePathEarly &&
    !filePath &&
    !hasShellOnly &&
    !hasSectionIntent &&
    !close
  ) {
    return {
      ok: false,
      error:
        "studio.nav requires kind, livePath, filePath, projectId, tab, layout/split, or close",
    };
  }

  if (close && kinds.length === 0) {
    return {
      ok: false,
      error: "studio.nav close requires kind / kinds to close",
    };
  }

  // Split panes must be opened (unless closing).
  if (!close && splitPanes) {
    for (const k of splitPanes) {
      if (!kinds.includes(k)) kinds.push(k);
    }
  }

  if (!close && kinds.length === 0 && livePathEarly) kinds.push("live");
  if (!close && kinds.length === 0 && filePath) {
    if (preferDesign) kinds.push("design");
    else if (preferLive) kinds.push("live");
    else kinds.push("code");
  }

  const focusRaw = input.focus;
  let focus: ViewMenuItemId | undefined =
    asKind(focusRaw) ??
    (kinds.length > 0 ? kinds[kinds.length - 1] : undefined);
  if (focusRaw !== undefined && focusRaw !== null && !asKind(focusRaw)) {
    return {
      ok: false,
      error: `Unknown focus kind: ${String(focusRaw)}`,
    };
  }
  if (focus && !kinds.includes(focus) && !close) {
    kinds.push(focus);
  }

  const livePath = livePathEarly;
  if (
    input.livePath !== undefined &&
    input.livePath !== null &&
    String(input.livePath).trim() !== "" &&
    !livePath
  ) {
    return { ok: false, error: "Invalid livePath (use a site path like /pricing)" };
  }
  if (
    ((input.filePath !== undefined &&
      input.filePath !== null &&
      String(input.filePath).trim() !== "") ||
      (input.codePath !== undefined &&
        input.codePath !== null &&
        String(input.codePath).trim() !== "")) &&
    !filePath
  ) {
    return {
      ok: false,
      error:
        "Invalid filePath (use a project-relative path like content/pages/home.md)",
    };
  }
  if (
    !livePath &&
    !filePath &&
    input.path !== undefined &&
    input.path !== null &&
    String(input.path).trim() !== ""
  ) {
    return {
      ok: false,
      error:
        "Invalid path (site path like /pricing, or project file like content/pages/home.md)",
    };
  }

  const ssectParsed =
    input.ssect !== undefined && input.ssect !== null
      ? parseSettingsSection(input.ssect)
      : null;
  const ssect: SettingsNavSection | undefined =
    ssectParsed == null ? undefined : ssectParsed;
  const asect =
    input.asect !== undefined && input.asect !== null
      ? normalizeAsect(input.asect)
      : undefined;
  if (
    input.asect !== undefined &&
    input.asect !== null &&
    String(input.asect).trim() !== "" &&
    !asect
  ) {
    return {
      ok: false,
      error: `Unknown asect: ${String(input.asect)} (overview|funnels|tracking-plan|events)`,
    };
  }
  const emailTab =
    input.emailTab !== undefined && input.emailTab !== null
      ? normalizeEmailTab(input.emailTab)
      : undefined;
  if (
    input.emailTab !== undefined &&
    input.emailTab !== null &&
    String(input.emailTab).trim() !== "" &&
    !emailTab
  ) {
    return {
      ok: false,
      error: `Unknown emailTab: ${String(input.emailTab)} (campaigns|audiences|deliverability)`,
    };
  }
  const dsRaw = input.ds ?? input.designSurface ?? input.surface;
  let ds: DesignStudioSurface | undefined;
  if (dsRaw !== undefined && dsRaw !== null && String(dsRaw).trim() !== "") {
    const parsedDs = parseDesignStudioSurfaceInput(dsRaw);
    if (!parsedDs.ok) return parsedDs;
    ds = parsedDs.value;
  }

  if (!close) {
    if (livePath && !kinds.includes("live")) {
      kinds.push("live");
      if (!input.focus) focus = "live";
    }
    if (filePath) {
      if (preferDesign) {
        if (!kinds.includes("design")) kinds.push("design");
        if (!kinds.includes("code")) kinds.push("code");
        if (!input.focus) focus = "design";
      } else if (preferLive) {
        if (!kinds.includes("live")) kinds.push("live");
        if (!kinds.includes("code")) kinds.push("code");
        if (!input.focus) focus = "live";
      } else if (!kinds.includes("code")) {
        kinds.push("code");
        if (!input.focus) focus = "code";
      }
    }
    if (ssect && !kinds.includes("settings")) {
      kinds.push("settings");
      if (!input.focus) focus = "settings";
    }
    if (asect && !kinds.includes("analytics")) {
      kinds.push("analytics");
      if (!input.focus) focus = "analytics";
    }
    if (emailTab && !kinds.includes("email")) {
      kinds.push("email");
      if (!input.focus) focus = "email";
    }
    if (ds && !kinds.includes("design")) {
      kinds.push("design");
      if (!input.focus) focus = "design";
    }
    if (layout === "split" && !splitPanes && kinds.length >= 2) {
      splitPanes = kinds.slice(0, 2);
    }
  }

  const messageHandoff = parseMessageHandoffNav(
    input.messageHandoff ?? input.handoff,
  );
  if (
    (input.messageHandoff !== undefined && input.messageHandoff !== null) ||
    (input.handoff !== undefined && input.handoff !== null)
  ) {
    if (!messageHandoff) {
      return {
        ok: false,
        error:
          "Invalid messageHandoff (need messageId, conversationId, channel)",
      };
    }
    if (!close && !kinds.includes("chat")) {
      kinds.push("chat");
      if (!input.focus) focus = "chat";
    }
  }

  return {
    ok: true,
    command: {
      kinds,
      ...(focus ? { focus } : {}),
      ...(close ? { close: true } : {}),
      ...(livePath ? { livePath } : {}),
      ...(filePath ? { filePath } : {}),
      ...(preferDesign ? { preferDesign: true } : {}),
      ...(preferLive ? { preferLive: true } : {}),
      ...(ssect ? { ssect } : {}),
      ...(asect ? { asect } : {}),
      ...(emailTab ? { emailTab } : {}),
      ...(ds ? { ds } : {}),
      ...(projectId ? { projectId } : {}),
      ...(tab ? { tab } : {}),
      ...(layout ? { layout } : {}),
      ...(splitPanes ? { splitPanes } : {}),
      ...(splitRatio !== undefined ? { splitRatio } : {}),
      ...(messageHandoff ? { messageHandoff } : {}),
    },
  };
}

/**
 * Deterministic chat phrases — open Live / Settings / file.
 * Kept for tests / helpers — chat SSE must **not** auto-exec before harness.
 */
export function parseStudioNavChatIntent(
  text: string,
): StudioNavCommand | null {
  const t = text.trim();
  if (!t || t.length > 240) return null;

  // Close a window
  const closeKind = t.match(
    /\b(?:close|dismiss|hide)\s+(?:the\s+)?(code|live|chat|design|terminal|runtimes|media|calendar|email|workflows|analytics|memory|roadmap|notes|home|workspace|settings|messages|data|sheets|forms|integrations)\b/i,
  );
  if (closeKind) {
    const kind = asKind(closeKind[1]);
    if (kind) return { kinds: [kind], close: true };
  }

  // Split Code + Live (common)
  if (
    /\bsplit\b.{0,40}\b(code|live|preview)\b.{0,24}\b(code|live|preview)\b/i.test(
      t,
    ) ||
    /\b(code|live).{0,16}(and|&).{0,16}(code|live|preview).{0,16}\bsplit\b/i.test(
      t,
    )
  ) {
    return {
      kinds: ["code", "live"],
      focus: "live",
      layout: "split",
      splitPanes: ["code", "live"],
    };
  }

  // Switch project
  const projectMatch = t.match(
    /\b(?:switch|open|go)\s+(?:to\s+)?(?:project\s+)?["'`]?([a-zA-Z0-9][a-zA-Z0-9._-]{0,64})["'`]?/i,
  );
  if (
    projectMatch &&
    /\b(project|workspace)\b/i.test(t) &&
    !/\b(file|settings|preview|page)\b/i.test(t)
  ) {
    const projectId = normalizeProjectId(projectMatch[1]);
    if (projectId && projectId !== "project" && projectId !== "workspace") {
      return { kinds: [], projectId };
    }
  }

  // Left rail
  if (/\b(?:show|open|switch\s+to)\s+(?:the\s+)?files?\s+(?:tree|tab|rail)\b/i.test(t)) {
    return { kinds: [], tab: "files" };
  }
  if (/\b(?:show|open|switch\s+to)\s+(?:the\s+)?nav(?:igation)?\s+(?:tree|tab|rail)\b/i.test(t)) {
    return { kinds: [], tab: "nav" };
  }

  // Explicit settings section
  if (
    /\b(open|show|go\s+to|switch\s+to)\b.{0,40}\bsettings\b/i.test(t) ||
    /\bsettings\s*→\s*ai\b/i.test(t) ||
    /\bsettings\s+ai\b/i.test(t)
  ) {
    const ai = /\bai\b|access\s+mode|full\s+(?:computer\s+)?access/i.test(t);
    return {
      kinds: ["settings"],
      focus: "settings",
      ssect: ai
        ? "ai"
        : coerceSettingsSection(
            parseSettingsSection(
              /\bmcp\b/i.test(t)
                ? "mcp-tools"
                : /\bstartup\b/i.test(t)
                  ? "startup"
                  : "general",
            ),
          ),
    };
  }

  // Live / Website Preview — optional path in quotes or after "to"
  if (
    /\b(open|show|bring\s+me\s+to|take\s+me\s+to|go\s+to|switch\s+to)\b.{0,48}\b(live|website\s+preview|preview|that\s+page|the\s+page)\b/i.test(
      t,
    ) ||
    /\b(show|open)\s+(me\s+)?(the\s+)?(website|site|preview)\b/i.test(t)
  ) {
    const pathMatch =
      t.match(/["'`](\/[^"'`\s]+)["'`]/) ||
      t.match(/\b(?:path|url|route)\s*[:=]\s*(\/[^\s]+)/i) ||
      t.match(/\bto\s+(\/[a-z0-9/_-]*)/i);
    const livePath = pathMatch
      ? normalizeStudioNavLivePath(pathMatch[1])
      : undefined;
    return {
      kinds: ["live"],
      focus: "live",
      ...(livePath ? { livePath } : {}),
    };
  }

  // Open a project file in Code — before bare "open code window"
  const fileMatch =
    t.match(
      /\b(?:open|show|go\s+to|switch\s+to)\s+(?:(?:the\s+)?(?:file|code)\s+(?:for\s+|at\s+)?)?["'`]([a-zA-Z0-9_.@+/-]+\.[a-zA-Z0-9]+)["'`]/i,
    ) ||
    t.match(
      /\b(?:open|show|go\s+to)\s+(?:the\s+)?file\s+([a-zA-Z0-9_.@+/-]+\.[a-zA-Z0-9]+)/i,
    ) ||
    t.match(
      /\b(?:file|path)\s*[:=]\s*["'`]?([a-zA-Z0-9_.@+/-]+\.[a-zA-Z0-9]+)["'`]?/i,
    );
  if (fileMatch) {
    const filePath = normalizeStudioNavFilePath(fileMatch[1]);
    if (filePath) {
      const preferDesign = /\bin\s+design\b/i.test(t);
      const preferLive = /\bin\s+(?:live|preview)\b/i.test(t);
      return {
        kinds: preferDesign ? ["design", "code"] : preferLive ? ["live", "code"] : ["code"],
        focus: preferDesign ? "design" : preferLive ? "live" : "code",
        filePath,
        ...(preferDesign ? { preferDesign: true } : {}),
        ...(preferLive ? { preferLive: true } : {}),
      };
    }
  }

  // Open any registry canvas kind (longest id first so workspace beats work)
  const kindAlt = canvasWindowIds()
    .slice()
    .sort((a, b) => b.length - a.length)
    .join("|");
  const openKind = t.match(
    new RegExp(
      `\\b(?:open|show|go\\s+to|switch\\s+to)\\s+(?:the\\s+)?(${kindAlt})\\b`,
      "i",
    ),
  );
  if (openKind) {
    const kind = asKind(openKind[1]);
    if (kind) return { kinds: [kind], focus: kind };
  }

  return null;
}
