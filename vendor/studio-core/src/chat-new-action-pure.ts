/**
 * New-chat vs compact-fork — spawned workers keep the relationship.
 */

export type ChatNewAction = "new" | "compact-fork";

export type ChatNewActionSession = {
  id?: string | null;
  title?: string | null;
};

/** Spawned Agent-room children use `spawn_` ids (agent-room-pure). */
export function isSpawnedWorkerSessionId(id: string | null | undefined): boolean {
  return (id ?? "").trim().startsWith("spawn_");
}

export function resolveChatNewAction(
  session: ChatNewActionSession | null | undefined,
): ChatNewAction {
  if (isSpawnedWorkerSessionId(session?.id)) return "compact-fork";
  return "new";
}
