/**
 * Studio Task types — typed workers for Multitask / agents.spawn (shell plane).
 * Not Cursor IDE Task API — Studio registry only.
 */

export type StudioTaskTypeId =
  | "explore"
  | "shell"
  | "review"
  | "general";

export type StudioTaskTypeRow = {
  id: StudioTaskTypeId;
  label: string;
  /** Default child harness hint for Agent room spawn. */
  defaultHarnessId: string;
  /** Prefixed into spawn intent / prompt. */
  promptPrefix: string;
  /** Suggested allowTools when Plan-like; null = full. */
  allowTools: readonly string[] | null;
};

const PLANISH: readonly string[] = [
  "tools.search",
  "tools.describe",
  "files.list",
  "files.read",
  "git.status",
  "git.diff",
  "mcp.list_tools",
  "skills.list",
  "skills.read",
  "agents.room.list",
  "memory.search",
  "memory.get",
  "web.search",
];

export const STUDIO_TASK_TYPES: readonly StudioTaskTypeRow[] = [
  {
    id: "explore",
    label: "Explore",
    defaultHarnessId: "cursor",
    promptPrefix:
      "Task: Explore — search the codebase; report findings; do not write files unless asked.",
    allowTools: PLANISH,
  },
  {
    id: "shell",
    label: "Shell",
    defaultHarnessId: "cursor",
    promptPrefix:
      "Task: Shell — run Host CLI / shell.run as needed; keep changes minimal and verified.",
    allowTools: null,
  },
  {
    id: "review",
    label: "Review",
    defaultHarnessId: "anthropic",
    promptPrefix:
      "Task: Review — read-only critique of the named change; list risks and tests.",
    allowTools: PLANISH,
  },
  {
    id: "general",
    label: "General",
    defaultHarnessId: "agent-room",
    promptPrefix: "Task: General — complete the user request with Studio tools.",
    allowTools: null,
  },
] as const;

export function getStudioTaskType(
  id: string | null | undefined,
): StudioTaskTypeRow | null {
  const key = (id ?? "").trim().toLowerCase();
  return STUDIO_TASK_TYPES.find((t) => t.id === key) ?? null;
}

export function parseStudioTaskTypeId(
  raw: unknown,
): StudioTaskTypeId {
  const row = getStudioTaskType(typeof raw === "string" ? raw : "");
  return row?.id ?? "general";
}

/** Payload for agents.spawn from a typed Task. */
export function studioTaskSpawnPayload(input: {
  typeId: string | null | undefined;
  userPrompt: string;
  parentChatId: string;
  childChatId?: string;
}): {
  parentChatId: string;
  childChatId?: string;
  harnessId: string;
  label: string;
  intent: string;
  allowTools: readonly string[] | null;
} {
  const row = getStudioTaskType(input.typeId) ?? getStudioTaskType("general")!;
  const prompt = input.userPrompt.trim();
  const intent = [row.promptPrefix, prompt].filter(Boolean).join("\n\n");
  return {
    parentChatId: input.parentChatId.trim(),
    ...(input.childChatId?.trim()
      ? { childChatId: input.childChatId.trim() }
      : {}),
    harnessId: row.defaultHarnessId,
    label: row.label,
    intent: intent.slice(0, 500),
    allowTools: row.allowTools,
  };
}
