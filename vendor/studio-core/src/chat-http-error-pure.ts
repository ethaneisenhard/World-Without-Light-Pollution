/**
 * Humanize HTTP chat failures + build a pasteable debug bundle.
 * Client currently surfaces only `chat ${status}` — not enough to share/diagnose.
 */

export type ChatHttpErrorBody = {
  error?: unknown;
  message?: unknown;
  hint?: unknown;
  proxy?: unknown;
};

export type ChatHttpErrorInput = {
  status: number;
  statusText?: string;
  bodyText?: string;
  /** Last UI stream status before failure (e.g. Connecting…). */
  lastStatus?: string;
  projectId?: string;
  harness?: string;
  mode?: string;
  elapsedMs?: number;
};

export type ChatDebugBundle = {
  kind: "studio-chat-debug";
  at: string;
  status: number;
  statusText?: string;
  message: string;
  hint?: string;
  lastStatus?: string;
  projectId?: string;
  harness?: string;
  mode?: string;
  elapsedMs?: number;
  bodySnippet?: string;
};

function asTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  return t || undefined;
}

export function parseChatHttpErrorBody(bodyText: string | undefined): ChatHttpErrorBody {
  if (!bodyText?.trim()) return {};
  try {
    const parsed = JSON.parse(bodyText) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as ChatHttpErrorBody;
  } catch {
    return {};
  }
}

/** Map status (+ optional JSON body) → operator-facing message. */
export function formatChatHttpError(input: ChatHttpErrorInput): {
  message: string;
  hint?: string;
  bundle: ChatDebugBundle;
} {
  const parsed = parseChatHttpErrorBody(input.bodyText);
  const bodyMessage = asTrimmedString(parsed.message);
  const bodyHint = asTrimmedString(parsed.hint);
  const bodyError = asTrimmedString(parsed.error);

  let hint = bodyHint;
  let message = bodyMessage;

  const plainBody = input.bodyText?.trim();
  const looksJson = plainBody?.startsWith("{") || plainBody?.startsWith("[");
  if (!message && plainBody && !looksJson) {
    // Wrangler mid-reload: plain "Your worker restarted mid-request…"
    message = plainBody.slice(0, 400);
    if (input.status === 503) {
      hint ??=
        "Dev hot-reload killed the turn. Chat now talks to :3847 directly on :4400 — retry.";
    }
  }

  if (!message) {
    if (input.status === 503) {
      message =
        "Chat unavailable (503) — Studio often hot-reloaded mid-turn in dev. Retry once the UI settles.";
      hint ??=
        "If this keeps happening while files rebuild, wait for “client rebuilt” then send again.";
    } else if (input.status === 502) {
      message =
        bodyError === "studio_api_unreachable"
          ? "Studio API unreachable (502)."
          : "Chat proxy failed (502).";
      hint ??= "API on :3847 may be down — pnpm stop:force && pnpm dev";
    } else if (input.status === 401 || input.status === 403) {
      message = `Chat auth failed (${input.status}).`;
      // Worker gate is session cookie — not provider API keys.
      // Provider keys fail later as SSE errors, not HTTP 401 on /api proxy.
      hint ??=
        "Sign in again (Studio session). Local: http://127.0.0.1:4400/login — not ANTHROPIC/DEEPSEEK keys.";
    } else if (input.status === 404) {
      message = "Chat route or project not found (404).";
    } else if (input.status === 429) {
      message = "Chat rate-limited (429). Wait and retry.";
    } else if (input.status >= 500) {
      message = `Chat server error (${input.status}${input.statusText ? ` ${input.statusText}` : ""}).`;
    } else {
      message = `Chat request failed (${input.status}${input.statusText ? ` ${input.statusText}` : ""}).`;
    }
  }

  const bodySnippet = input.bodyText?.trim()
    ? input.bodyText.trim().slice(0, 800)
    : undefined;

  const bundle: ChatDebugBundle = {
    kind: "studio-chat-debug",
    at: new Date().toISOString(),
    status: input.status,
    ...(input.statusText ? { statusText: input.statusText } : {}),
    message,
    ...(hint ? { hint } : {}),
    ...(input.lastStatus ? { lastStatus: input.lastStatus } : {}),
    ...(input.projectId ? { projectId: input.projectId } : {}),
    ...(input.harness ? { harness: input.harness } : {}),
    ...(input.mode ? { mode: input.mode } : {}),
    ...(input.elapsedMs != null ? { elapsedMs: input.elapsedMs } : {}),
    ...(bodySnippet ? { bodySnippet } : {}),
  };

  const display = hint ? `${message}\n\n${hint}` : message;
  return { message: display, hint, bundle };
}

/**
 * Bounce to login only for **Worker session** 401s (`Sign in to use Studio API`).
 * Host token 401s (e.g. bare `:3847`) must not look like a logout.
 */
export function chatAuthFailureLoginHref(input: {
  status: number;
  /** Current path+search; open-redirect safe (path-only). */
  returnTo?: string;
  /** Raw response body — used to distinguish session vs Host auth. */
  bodyText?: string;
}): string | null {
  if (input.status !== 401 && input.status !== 403) return null;
  const parsed = parseChatHttpErrorBody(input.bodyText);
  const hint = asTrimmedString(parsed.hint) ?? "";
  const error = asTrimmedString(parsed.error) ?? "";
  const isWorkerSessionGate =
    /sign in to use studio api/i.test(hint) ||
    (/unauthorized/i.test(error) && /sign in/i.test(hint));
  if (!isWorkerSessionGate) return null;
  const raw = (input.returnTo ?? "/").trim() || "/";
  const path =
    raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  return `/login?error=auth&returnTo=${encodeURIComponent(path)}`;
}

export function stringifyChatDebugBundle(bundle: ChatDebugBundle): string {
  return JSON.stringify(bundle, null, 2);
}
