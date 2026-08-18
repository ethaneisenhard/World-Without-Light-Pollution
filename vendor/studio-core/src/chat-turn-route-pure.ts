/**
 * Classify whether a chat send should use interactive HarnessRuntime
 * or DurableRuntime (Background). ADR 0013 — route at start, never mid-turn hijack.
 *
 * Composer default is always harness-turn unless the user arms Workflow agent.
 * Studio self-edit paths stay interactive (Host-owned turn + reattach survives
 * live-reload). Auto-routing those to Workflow agent hijacked chat UX.
 */

export type ChatExecutionPlane = "harness-turn" | "durable-background";

export type ChatTurnRouteSource =
  | "composer"
  | "fix-build"
  | "mcp"
  | "api"
  | string;

export type ChatTurnRouteInput = {
  intent: string;
  userArmedBackground?: boolean;
  source?: ChatTurnRouteSource;
};

export type ChatTurnRouteResult = {
  plane: ChatExecutionPlane;
  classifierId: string;
  reason: string;
};

/** Path / phrase signals that Studio chrome self-edit will trigger live-reload. */
const STUDIO_SELF_EDIT_PATH_RE =
  /(?:^|[\s`'"(])((?:apps\/studio\/(?:client|src|scripts)|packages\/studio\/|[\w./-]*studio-ui-[\w.-]+\.ts|\.cursor\/rules\/(?:shell|remix|design)\/)[\w./@-]*)/i;

const STUDIO_SELF_EDIT_PHRASE_RE =
  /\b(fix(?:\s+the)?\s+studio\s+client\s+build|edit(?:ing)?\s+studio\s+chrome|dogfood(?:ing)?\s+studio\s+chrome|live-?reload\s+studio)\b/i;

export function matchesStudioSelfEditIntent(intent: string): boolean {
  const text = intent.trim();
  if (!text) return false;
  if (STUDIO_SELF_EDIT_PHRASE_RE.test(text)) return true;
  return STUDIO_SELF_EDIT_PATH_RE.test(text);
}

export function resolveChatExecutionPlane(
  input: ChatTurnRouteInput,
): ChatTurnRouteResult {
  if (input.userArmedBackground) {
    return {
      plane: "durable-background",
      classifierId: "user-background",
      reason: "Composer Workflow agent armed",
    };
  }
  const source = (input.source ?? "composer").trim() || "composer";
  switch (source) {
    case "fix-build":
      return {
        plane: "durable-background",
        classifierId: "fix-build",
        reason: "Dev Control Plane fix-build",
      };
    default:
      break;
  }
  // Studio self-edit: stay on harness-turn (reattach). Do not auto-arm Workflow.
  return {
    plane: "harness-turn",
    classifierId: matchesStudioSelfEditIntent(input.intent)
      ? "studio-self-edit-interactive"
      : "default",
    reason: "Interactive chat turn",
  };
}
