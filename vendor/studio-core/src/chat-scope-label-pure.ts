/**
 * Chat scope labels — global (`_studio`) vs workspace project.
 * Keeps picker/footer language consistent (never two “Glass Box Studio” twins).
 */

import { STUDIO_ROOT_CHAT_ID, isStudioRootChatId } from "./chat-pure.js";

export function isChatGlobalScope(
  projectId: string | null | undefined,
): boolean {
  const id = projectId?.trim() ?? "";
  return !id || isStudioRootChatId(id);
}

/** `<option>` for global / root chat. */
export function chatGlobalScopeOptionLabel(): string {
  return "Global · no project";
}

/** Compact chip face when global is selected. */
export function chatGlobalScopeFaceLabel(): string {
  return "Global";
}

/** Footer / status line when no workspace project is bound. */
export function chatGlobalScopeFooterLabel(): string {
  return "global";
}

/**
 * Label for a registered project in the chat scope picker.
 * Uses display name / name — never collides with the Global option text.
 */
export function chatProjectScopeOptionLabel(input: {
  id: string;
  name?: string;
  displayName?: string;
}): string {
  if (isStudioRootChatId(input.id) || input.id === STUDIO_ROOT_CHAT_ID) {
    return chatGlobalScopeOptionLabel();
  }
  const label =
    input.displayName?.trim() || input.name?.trim() || input.id.trim();
  return label || input.id;
}

/** Compact chip face for the selected project scope. */
export function chatProjectScopeFaceLabel(input: {
  sendProjectId: string | null | undefined;
  projectName?: string;
  displayName?: string;
  /** When no projects registered and not global. */
  emptyLabel?: string;
}): string {
  if (isChatGlobalScope(input.sendProjectId)) {
    return chatGlobalScopeFaceLabel();
  }
  const label =
    input.displayName?.trim() ||
    input.projectName?.trim() ||
    input.sendProjectId?.trim();
  return label || input.emptyLabel || "Project";
}

/** Footer project cell — `global` or project id. */
export function chatScopeFooterProjectLabel(
  projectId: string | null | undefined,
): string {
  if (isChatGlobalScope(projectId)) return chatGlobalScopeFooterLabel();
  return projectId!.trim();
}

/**
 * `<select>` value for chat scope.
 * Sticky Global wins. An explicit project pick / send target wins over URL
 * (PICK does not rewrite `?project=` — URL-first made the select snap back).
 * Shareable `?project=` wins over machine Global / unseeded `_studio`.
 */
export function resolveChatScopeSelectValue(input: {
  stickyGlobal?: boolean;
  /** Machine / bound send id (`_studio` = global). */
  scopeSendId?: string | null;
  /** Live URL / registry project id. */
  urlProjectId?: string | null;
}): string {
  const url = input.urlProjectId?.trim() ?? "";
  if (input.stickyGlobal) return "_studio";
  const scope = input.scopeSendId?.trim() ?? "";
  if (scope && !isStudioRootChatId(scope)) return scope;
  if (url) return url;
  return "_studio";
}
