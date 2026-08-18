export type ProjectMode = "native" | "mapped";

export type {
  ComputePlacement,
  ProjectComputeConfig,
} from "./compute-placement-pure.js";
import type { ProjectComputeConfig } from "./compute-placement-pure.js";

export type ProjectRegistryEntry = {
  id: string;
  path: string;
  name?: string;
};

export type ProjectRegistry = {
  version: number;
  projects: ProjectRegistryEntry[];
};

/**
 * Maps a content file under a nav section to a Live preview URL path.
 * Config-driven — no per-project hardcoding in Studio shell.
 *
 * `pattern`: site path with `:slug` (file stem). Example `/:slug` or `/blog/:slug`.
 * `index`: stem that should use `indexUrl` instead (default `"home"` → `/`).
 */
export type ProjectNavRoute = {
  pattern: string;
  index?: string;
  indexUrl?: string;
};

export type ProjectNavEntry = {
  path: string;
  kind?: string;
  /** Live canvas route map for `pages` / `mdx-posts` (and future view kinds). */
  route?: ProjectNavRoute;
  children?: Record<string, ProjectNavEntry | string>;
};

export type ProjectHosting = {
  provider?: string;
  prod_url?: string;
  config_path?: string;
  git?: {
    enabled?: boolean;
    default_branch?: string;
    require_clean?: boolean;
  };
  deploy?: {
    command?: string;
    args?: string[];
    cwd?: string;
    env?: string;
    requires?: string[];
    /** Named targets for monorepos. */
    targets?: Array<{
      id: string;
      cwd?: string;
      command?: string;
      args?: string[];
    }>;
  };
  /**
   * Project-owned Live reload.
   * Prefer `vite-full-reload/1` (Studio writes disk; project Vite reloads iframe).
   * Legacy `as-hmr/1` pushes draft content via postMessage.
   * See `packages/library/preview-bridge/README.md`.
   */
  hmr?: {
    /** Script on project origin, e.g. `/as-hmr-bridge.js`. */
    bridge: string;
    protocol: "as-hmr/1" | "vite-full-reload/1";
    /** Vite `@vite/client` URL when protocol is `vite-full-reload/1`. */
    viteClient?: string;
  };
  /**
   * Run after Studio writes a content file (e.g. regenerate pages/posts).
   * `command` + `args` are spawned in the project root (no shell).
   */
  content_generate?: {
    command: string;
    args: string[];
    /** Only run when written path matches one of these prefixes (default: `content/`). */
    path_prefixes?: string[];
  };
};

/** How a local Dev server process is implemented. */
export type DevServerRuntime = "node" | "wrangler";

/**
 * One startable local process (CONTEXT: Dev server).
 * `profiles` lists which named profiles include this server when a project is turned ON.
 */
export type ProjectDevServer = {
  id: string;
  label?: string;
  /** Logical role — `web` is what Live/Design iframes need. */
  kind?: "web" | "api" | "worker" | string;
  /**
   * Listen port — preferred knob when changing where the app runs.
   * Wins over the port in `url`; substitutes `{port}` in `url` / `command` / `args`.
   * Inherits `dev.port` for `kind: "web"` when omitted.
   */
  port?: number;
  /**
   * Preview / health URL (iframe + attach probe).
   * Optional when `port` (or inherited `dev.port`) is set — defaults to `http://127.0.0.1:{port}`.
   * May include `{port}` placeholder.
   */
  url?: string;
  runtime: DevServerRuntime;
  command: string;
  args: string[];
  /** Profiles that include this server (e.g. minimal, full). */
  profiles: string[];
};

/**
 * What to do when spawn exits because another Dev process already owns
 * this project (or port). Configurable per project — not a host one-off.
 *
 * - `stop-stale-and-retry` (default): kill parsed PID(s) when match allows, retry once
 * - `attach`: keep prior behavior — probe alternate URLs / attach if healthy
 * - `fail`: surface the spawn error (no attach, no kill)
 */
export type ProjectDevStartPolicy = {
  onAlreadyRunning?: "stop-stale-and-retry" | "attach" | "fail";
  /**
   * Which stale PIDs are safe to kill.
   * - `same-root` (default): only when log Dir matches the project root
   * - `any-pid`: any PID parsed from conflict logs (more aggressive)
   */
  match?: "same-root" | "any-pid";
  /** Max kill→retry rounds (0–3, default 1). */
  retry?: number;
  stop?: {
    signal?: "SIGTERM" | "SIGKILL";
    graceMs?: number;
  };
};

export type ProjectDevConfig = {
  /** Profile used when toggling the project ON (default: first server's first profile or "minimal"). */
  defaultProfile?: string;
  /**
   * Default listen port for `kind: "web"` servers that omit `port`.
   * One obvious place to point Studio at an externally running app.
   */
  port?: number;
  /**
   * Spawn conflict policy (stale Next / same-root Dev servers).
   * Omitted → stop-stale-and-retry + same-root (see normalizeDevStartPolicy).
   */
  startPolicy?: ProjectDevStartPolicy;
  servers?: ProjectDevServer[];
};

export type ProjectConfig = {
  id: string;
  name?: string;
  /**
   * Workspace kind — e.g. `planning` (notes/roadmap life project)
   * vs app/site scaffolds.
   */
  kind?: string;
  mode?: ProjectMode;
  root?: string;
  /**
   * Compute placement (ADR 0016) — where files / runtimes / harness run.
   * Orthogonal to vault Host (chats, notes, media, calendar).
   */
  compute?: ProjectComputeConfig;
  nav?: Record<string, ProjectNavEntry | string>;
  hosting?: ProjectHosting;
  /** Local Dev servers Studio may spawn (ADR 0001). */
  dev?: ProjectDevConfig;
  /** Concern → data-destination id (records, forms, media, analytics, …). */
  storage?: Record<string, string>;
  /** Section provider plugin ids (media, calendar, email, …). */
  providers?: Record<string, { plugin?: string; scope?: string; registry?: string }>;
  /**
   * Named workspace-rail experiences (Nav/Files slots + nav projection).
   * Resolved with global/user overlays — see workspace-rail-experience-pure.
   */
  experiences?: {
    default?: string;
    profiles?: Record<
      string,
      {
        id?: string;
        label?: string;
        workspaceSlots?: string[];
        nav?: unknown;
        studioPanels?: { include?: string[]; exclude?: string[] };
      }
    >;
  };
};

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  /** Optional vision attachments (base64) for Anthropic multimodal. */
  images?: Array<{
    mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    data: string;
    name?: string;
  }>;
};
