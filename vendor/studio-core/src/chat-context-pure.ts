/**
 * Studio UI → chat system context (selected file, Website Preview path).
 */

import type { AccessMode } from "./access-mode-pure.js";
import {
  chatGlobalScopeFaceLabel,
  isChatGlobalScope,
} from "./chat-scope-label-pure.js";
import {
  DEFAULT_GLOBAL_FILE_ACCESS,
  type GlobalFileAccessConfig,
} from "./global-file-access-pure.js";
import { viewMenuLabelForId } from "./view-menu-pure.js";
import {
  formatHostIdentityChatLines,
  type HostAttachProjection,
} from "./host-attach-pure.js";

export type StudioChatRegisteredProject = {
  id: string;
  name?: string;
};

export type StudioChatContextInput = {
  projectId: string;
  /**
   * Shell → Host attach (Desk cloud vs laptop). Authoritative for
   * “which host?” — prefer over guessing from filesystem paths.
   */
  hostAttach?: HostAttachProjection | null;
  /** Nav / Code selected path (project-relative). */
  selectedPath?: string;
  /** Site path Website Preview is showing, e.g. `/` or `/contact`. */
  liveSitePath?: string;
  /** Absolute or origin Website Preview base URL when known. */
  liveBaseUrl?: string;
  codeOpen?: boolean;
  liveOpen?: boolean;
  designOpen?: boolean;
  /** DeskPane kind currently focused (URL `focus=` / layout machine). */
  focusedKind?: string | null;
  /** Open canvas kinds (tabs), focused first when present. */
  openKinds?: readonly string[];
  /**
   * Forms deskpane destination / sandbox form id (e.g. `contact`).
   * Authoritative when Forms is open or focused.
   */
  formsFormId?: string | null;
  /**
   * Registered workspaces (global chat only) — ids for `@ws/<id>/…` targeting.
   */
  registeredProjects?: readonly StudioChatRegisteredProject[];
  /**
   * Effective AI access mode (approvals / catalog breadth — not Global file gate).
   * Defaults to guarded when omitted.
   */
  accessMode?: AccessMode;
  /** Global Chat disk roots; defaults enable Studio monorepo + all workspaces. */
  globalFileAccess?: GlobalFileAccessConfig;
  /**
   * Other open Studio chat tabs (read-only peer logs).
   * Isolation stays per-session; this is awareness only — cite when asked.
   */
  peerChats?: readonly StudioChatPeerContext[];
};

/** Compact peer-chat excerpt for cross-tab awareness. */
export type StudioChatPeerContext = {
  sessionId: string;
  streaming: boolean;
  turns: readonly { role: string; content: string }[];
};

/** Server + client Global scope protocol (answer-first life OS). */
export function buildStudioRootChatHint(
  accessMode: AccessMode = "guarded",
  globalFileAccess: GlobalFileAccessConfig = DEFAULT_GLOBAL_FILE_ACCESS,
): string {
  const gfa = globalFileAccess;
  const studioOk = gfa.studioMonorepo;
  const ws = gfa.workspaces;
  const wsLine =
    ws === "all"
      ? "Registered workspaces: edit via `@ws/<projectId>/…` or files.* projectId — stay on Global; do not require studio.workspace.switch for disk work."
      : ws === "none"
        ? "Registered workspace file edits are disabled (ai.globalFileAccess.workspaces=none). Use studio.workspace.switch only if the user wants that project's Chat ledger."
        : `Registered workspace file edits limited to: ${ws.join(", ")}. Use @ws/<id>/… or projectId for those ids only.`;
  const fileLine = studioOk
    ? `Studio monorepo: files.read/write via @studio/… (or monorepo-relative under repo root) while staying in Global. Prefer Keep/Undo. ${wsLine}`
    : `Studio monorepo file edits disabled (ai.globalFileAccess.studioMonorepo=false). ${wsLine}`;
  const accessNote =
    accessMode === "all"
      ? "All-access: full catalog + auto-approve push/deploy."
      : "Guarded: allowlists + Approve for push/deploy — file roots above still apply.";
  return [
    "You are chatting at Glass Box Studio GLOBAL scope — the parent orchestrator for life, work, creative, and software projects.",
    "Do not ask which project you are in — answer: Global / no project.",
    "Answer the user's question first. Never claim topics are outside Studio, software-only, or outside your wheelhouse.",
    "When a topic has legs (van build, trip, business, renovation, etc.), offer a workspace — then call tools.call action=studio.workspace.create (name/slug/brief). Do not claim create is UI-only. Result auto-switches Chat scope.",
    "Clone a GitHub repo into a workspace: tools.call action=studio.workspace.cloneFromGit with a real github.com/owner/repo URL. If they name a site (beehiiv.com / beehive.com) or just “the GitHub”, web.search `{name} github`, pick the first github.com/owner/repo, then cloneFromGit. Do not spawn Multitask / Agent room. If GitHub is signed out, the tool returns a phone code — do not shell.run git clone.",
    "You may change global Studio config / chrome theme / window colors, list skills, and call MCP.",
    fileLine,
    "Product source is always workspace id `glassbox-studio` (Host repo root). Switch Chat there when the user wants to work on Studio itself (Code tree / git). Quick edits can stay on Global via `@studio/…`.",
    accessNote,
    "Do not tell the user they must leave Global to edit Studio chrome — `@studio/…` works here. studio.workspace.switch to `glassbox-studio` is for Code tree / git / sticky Chat, not a gate for those path edits.",
  ].join(" ");
}

/** Human-readable system block for Anthropic / ContextBundle. */
export function formatStudioChatContext(
  input: StudioChatContextInput,
): string {
  const global = isChatGlobalScope(input.projectId);
  const lines: string[] = [
    "Studio UI context (authoritative — prefer these over guessing):",
  ];

  const hostLines = input.hostAttach
    ? formatHostIdentityChatLines(input.hostAttach)
    : [];
  for (const line of hostLines) lines.push(line);

  if (global) {
    const accessMode = input.accessMode ?? "guarded";
    const gfa = input.globalFileAccess ?? DEFAULT_GLOBAL_FILE_ACCESS;
    lines.push(
      `- chat scope: GLOBAL (${chatGlobalScopeFaceLabel()} · no workspace)`,
      `- projectId: _studio`,
      `- access mode: ${accessMode}`,
      `- globalFileAccess: studioMonorepo=${gfa.studioMonorepo} workspaces=${
        typeof gfa.workspaces === "string"
          ? gfa.workspaces
          : gfa.workspaces.join(",")
      }`,
      "ACTIVE SCOPE: Global chat — parent orchestrator (life, work, creative, software). You are NOT inside a project workspace.",
      "Do NOT ask which workspace you are in for this turn — answer: Global / no project.",
      "Protocol: answer first; never gatekeep as software-only. When a topic has legs, offer a planning workspace.",
      gfa.studioMonorepo
        ? "Studio chrome/product: edit via files.* path `@studio/…` (or monorepo-relative), or studio.workspace.switch to `glassbox-studio` for a full Code-tree workspace. Stay on Global for quick `@studio/` edits."
        : "Studio monorepo file edits disabled in config (ai.globalFileAccess.studioMonorepo=false).",
      gfa.workspaces === "all"
        ? "Registered workspaces: edit via `@ws/<projectId>/…` or files.*/git.* projectId without switching Chat scope."
        : gfa.workspaces === "none"
          ? "Registered workspace file edits disabled (ai.globalFileAccess.workspaces=none)."
          : `Registered workspace file edits allowed for: ${gfa.workspaces.join(", ")} (@ws/<id>/… or projectId).`,
      "studio.workspace.switch = Chat ledger / sticky scope only — not required for disk edits when paths above are allowed.",
    );
    const regs = input.registeredProjects ?? [];
    if (regs.length) {
      lines.push(
        "Registered projects (use @ws/<id>/… or projectId for files; switch only for ledger/UI focus):",
      );
      for (const p of regs.slice(0, 40)) {
        const name = p.name?.trim();
        lines.push(
          name && name !== p.id ? `  - ${p.id} (${name})` : `  - ${p.id}`,
        );
      }
    }
  } else {
    const pid = input.projectId.trim();
    lines.push(
      `- chat scope: PROJECT`,
      `- projectId: ${pid}`,
      `ACTIVE WORKSPACE: "${pid}". files.* / git.* / shell are already scoped to this project's root.`,
      "Do NOT ask which workspace or project the user is in — it is this projectId.",
      "Paths are project-relative (e.g. apps/studio/client/…). Never prefix with the project id.",
      "This workspace root IS the only editable tree this turn — not a demo sandbox beside a hidden product repo.",
      "If apps/studio/, packages/, or other product paths exist under this root, edit them here. Do NOT ask for a separate 'harness source' / 'Studio repo' path.",
      "Footer/chrome 'harness: …' names the agent runtime (studio/cursor/hermes/…) — it is NOT a different filesystem or project scope.",
    );
  }

  if (input.selectedPath) {
    lines.push(`- selected file/path: ${input.selectedPath}`);
  } else {
    lines.push("- selected file/path: (none)");
  }
  if (input.liveOpen && input.liveSitePath) {
    lines.push(`- Website Preview page: ${input.liveSitePath}`);
  } else if (input.liveOpen) {
    lines.push("- Website Preview: open (page path unknown)");
  } else {
    lines.push("- Website Preview: closed");
  }
  if (input.liveBaseUrl) {
    lines.push(`- Website Preview base URL: ${input.liveBaseUrl}`);
  }
  const focused = input.focusedKind?.trim() || "";
  if (focused) {
    lines.push(`- focused window: ${viewMenuLabelForId(focused)} (${focused})`);
  } else {
    lines.push("- focused window: (none)");
  }
  const open = (input.openKinds ?? []).map((k) => k.trim()).filter(Boolean);
  if (open.length) {
    lines.push(
      `- open windows: ${open.map((k) => viewMenuLabelForId(k)).join(", ")}`,
    );
  } else {
    if (input.codeOpen) lines.push("- Code window: open");
    if (input.designOpen) lines.push("- Design window: open");
  }
  const formId = input.formsFormId?.trim() || "";
  if (formId) {
    lines.push(`- Forms destination / form id: ${formId}`);
  }
  const peers = input.peerChats ?? [];
  if (peers.length) {
    lines.push(
      "Other open Studio chats (read-only peer logs — cite these when asked what other chats are doing; do not invent; do not claim session isolation hides them):",
    );
    for (const peer of peers.slice(0, 8)) {
      const sid = peer.sessionId.trim() || "(unknown)";
      const status = peer.streaming ? "streaming" : "idle";
      lines.push(`- peer session ${sid} (${status}):`);
      const turns = peer.turns ?? [];
      if (!turns.length) {
        lines.push("  (empty log)");
        continue;
      }
      for (const turn of turns) {
        const role = (turn.role || "unknown").trim() || "unknown";
        const content = (turn.content || "").trim() || "(empty)";
        lines.push(`  [${role}] ${content}`);
      }
    }
  } else {
    lines.push(
      "- other open Studio chats: (none in context — if the user asks about peer chats and you truly have no peer block above, say NO-PEER-LOGS)",
    );
  }
  lines.push(
    'You control Studio chrome. Never say you cannot open a window. To show a page: studio.nav livePath. To show a source file: studio.nav filePath (preferDesign/preferLive as needed). To open any DeskPane window including Messages (kind=messages), Notes, Roadmap, Memory, Chat, Settings, Code, Website Preview, Calendar, Media, Email, Forms, Workflows, Home: studio.nav kind=<id> (DeskPane apps — not NOTES.md in Code). To rearrange chrome windows: studio.nav kind/close/layout/projectId/tab. To reorganize right-rail Nav (rename, reorder, hide Files tab): studio.experience.get|set|patch — projection is display-only, not disk rename. Theme/brand/pet use studio.theme|brand|pet.set. When the user says "this", "these inputs", "the form", or "this window", use focused window + Forms destination above — do not ask which pane is open. When they say "this page", "the hero", or "homepage", use selected file and Website Preview page above. Call files.read on that path before editing.',
  );
  return lines.join("\n");
}

/** Short chip labels for Composer. */
export function studioChatContextChips(
  input: StudioChatContextInput,
): Array<{ id: string; label: string }> {
  const chips: Array<{ id: string; label: string }> = [];
  if (isChatGlobalScope(input.projectId)) {
    chips.push({ id: "project", label: chatGlobalScopeFaceLabel() });
  } else if (input.projectId) {
    chips.push({ id: "project", label: input.projectId });
  }
  if (input.selectedPath) {
    const short =
      input.selectedPath.length > 36
        ? `…${input.selectedPath.slice(-34)}`
        : input.selectedPath;
    chips.push({ id: "file", label: short });
  }
  if (input.liveOpen && input.liveSitePath) {
    chips.push({
      id: "live",
      label: `Preview ${input.liveSitePath === "/" ? "/" : input.liveSitePath}`,
    });
  }
  const focused = input.focusedKind?.trim() || "";
  if (focused) {
    chips.push({ id: "focus", label: viewMenuLabelForId(focused) });
  }
  const formId = input.formsFormId?.trim() || "";
  if (formId) {
    chips.push({ id: "forms", label: `form ${formId}` });
  }
  // Peer chats still inject into the prompt (`formatStudioChatContext`) —
  // no footer chip count (noisy; bag size ≠ useful "pairs" signal).
  return chips;
}
