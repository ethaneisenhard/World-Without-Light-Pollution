/**
 * Session fork / handoff shapes when hard budget cannot fit.
 */

import type { CompactMessage } from "./chat-compact-types-pure.js";
import { formatContextCompressSummary } from "./context-compress-pure.js";

export type SessionForkAction = {
  type: "fork";
  reason: string;
  parentSessionId: string | null;
  handoffSummary: string;
  /** Short title for the new session tab. */
  title: string;
  /** Messages to seed the continued turn / new session. */
  seedMessages: CompactMessage[];
};

export type SessionContinueAction = {
  type: "continue";
};

export type SessionPrepareAction = SessionForkAction | SessionContinueAction;

export function buildSessionForkHandoff(input: {
  messages: readonly CompactMessage[];
  projectId: string;
  parentSessionId?: string | null;
  reason?: string;
}): SessionForkAction {
  const reason = input.reason ?? "hard_budget";
  const lastUser = [...input.messages]
    .reverse()
    .find((m) => m.role === "user" && !m.compaction);
  const summary = formatContextCompressSummary({
    olderMessages: input.messages.filter((m) => m !== lastUser),
    projectId: input.projectId,
  });
  const handoffSummary = [
    "This conversation is being continued from earlier context after a context-window fork.",
    "Use this summary as prior context, and do not acknowledge the summary to the user.",
    "",
    "<summary>",
    summary,
    "</summary>",
  ].join("\n");

  const seedMessages: CompactMessage[] = [
    {
      id: `fork_handoff_${Date.now().toString(36)}`,
      role: "user",
      content: handoffSummary,
      compaction: {
        coveredMessageIds: input.messages
          .map((m) => m.id)
          .filter((id): id is string => Boolean(id)),
        reason,
        strategyId: "emergency_truncate",
      },
    },
  ];
  if (lastUser?.content?.trim()) {
    seedMessages.push({
      id: lastUser.id ?? `fork_user_${Date.now().toString(36)}`,
      role: "user",
      content: lastUser.content,
    });
  }

  return {
    type: "fork",
    reason,
    parentSessionId: input.parentSessionId ?? null,
    handoffSummary,
    title: "Continued · compacted",
    seedMessages,
  };
}

export function formatContinuationBanner(reason: string): string {
  const r = reason.trim() || "context full";
  return `New session — prior context compacted (${r}). Older chat stays in the previous tab.`;
}
