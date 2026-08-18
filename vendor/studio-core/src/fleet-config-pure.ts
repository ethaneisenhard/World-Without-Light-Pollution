/**
 * Orchestrator fleet prefs — show filter + harness pet overrides (pure).
 */

export const FLEET_SHOW_CHATS = ["all", "agentic", "spawn_durable"] as const;
export type FleetShowChats = (typeof FLEET_SHOW_CHATS)[number];

export type StudioFleetConfig = {
  /** Which Chat turns land on the office floor. */
  showChats: FleetShowChats;
  /** Per-harness pet id overrides (Settings). */
  harnessPets: Record<string, string>;
};

export const DEFAULT_STUDIO_FLEET_CONFIG: StudioFleetConfig = {
  showChats: "all",
  harnessPets: {},
};

export function parseFleetShowChats(raw: unknown): FleetShowChats {
  if (typeof raw !== "string") return DEFAULT_STUDIO_FLEET_CONFIG.showChats;
  const v = raw.trim();
  switch (v) {
    case "all":
    case "agentic":
    case "spawn_durable":
      return v;
    default:
      return DEFAULT_STUDIO_FLEET_CONFIG.showChats;
  }
}

export function parseStudioFleetConfig(raw: unknown): StudioFleetConfig {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_STUDIO_FLEET_CONFIG, harnessPets: {} };
  }
  const o = raw as Record<string, unknown>;
  const pets: Record<string, string> = {};
  if (o.harnessPets && typeof o.harnessPets === "object") {
    for (const [k, v] of Object.entries(
      o.harnessPets as Record<string, unknown>,
    )) {
      const key = k.trim().toLowerCase();
      if (!key || typeof v !== "string") continue;
      const id = v.trim();
      if (id) pets[key] = id;
    }
  }
  return {
    showChats: parseFleetShowChats(o.showChats),
    harnessPets: pets,
  };
}

/**
 * Gate chat → fleet upsert. Spawn/durable always publish (caller skips this).
 * `agentic` = tool/agent turns; `spawn_durable` = skip chat entirely.
 */
export function shouldUpsertChatToFleet(input: {
  showChats: FleetShowChats;
  /** True when turn used tools / agent mode / peer harness heavy path. */
  agentic: boolean;
}): boolean {
  switch (input.showChats) {
    case "all":
      return true;
    case "agentic":
      return input.agentic;
    case "spawn_durable":
      return false;
    default: {
      const _exhaustive: never = input.showChats;
      return _exhaustive;
    }
  }
}
