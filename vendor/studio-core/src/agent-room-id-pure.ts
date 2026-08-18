/**
 * Agent room / multiAgent id — Studio presence plane (not a harness).
 */

export const AGENT_ROOM_HARNESS_ID = "agent-room" as const;

export type AgentRoomHarnessId = typeof AGENT_ROOM_HARNESS_ID;
export type MultiAgentSetting = AgentRoomHarnessId | "off";

/** True when id is the Agent rooms presence setting. */
export function isAgentRoomHarnessId(id: string | null | undefined): boolean {
  const v = (id ?? "").trim().toLowerCase();
  return v === AGENT_ROOM_HARNESS_ID;
}

/**
 * Normalize multiAgent id: off stays off; agent-room / unknown → agent-room on.
 */
export function normalizeAgentRoomHarnessId(
  raw: unknown,
): string {
  if (typeof raw !== "string") return "";
  const v = raw.trim().toLowerCase();
  if (!v) return "";
  if (v === "off") return "off";
  if (v === AGENT_ROOM_HARNESS_ID) {
    return AGENT_ROOM_HARNESS_ID;
  }
  return raw.trim();
}

export function parseMultiAgentSetting(raw: unknown): MultiAgentSetting {
  if (raw === "off") return "off";
  if (typeof raw === "string" && raw.trim().toLowerCase() === "off") return "off";
  return AGENT_ROOM_HARNESS_ID;
}
