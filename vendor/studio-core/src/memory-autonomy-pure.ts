/**
 * Memory autonomy dial — when staged prefs may auto-activate (Wave 6).
 */

import type { MemoryRow } from "./memory-pure.js";
import { isMemoryPref } from "./memory-retrieve-pure.js";

export type MemoryAutonomyDial = "staged_only" | "auto_low_risk";

export function parseMemoryAutonomyDial(raw: unknown): MemoryAutonomyDial {
  return raw === "auto_low_risk" ? "auto_low_risk" : "staged_only";
}

/**
 * Low-risk = active prefs (why pref:… or pinned studio) that are hand/extract
 * authored — not imports. Default stays staged_only.
 */
export function shouldAutoActivateMemory(input: {
  row: Pick<MemoryRow, "status" | "origin" | "why" | "scope" | "score">;
  dial: MemoryAutonomyDial;
}): boolean {
  if (input.dial !== "auto_low_risk") return false;
  if (input.row.status !== "staged") return false;
  if (
    input.row.origin !== "hand_authored" &&
    input.row.origin !== "self_learn"
  ) {
    return false;
  }
  return isMemoryPref(input.row as MemoryRow);
}

/** Resolve status after propose given autonomy dial. */
export function memoryStatusAfterPropose(input: {
  requested: MemoryRow["status"] | undefined;
  row: Pick<MemoryRow, "origin" | "why" | "scope" | "score">;
  dial: MemoryAutonomyDial;
}): MemoryRow["status"] {
  const requested = input.requested ?? "staged";
  if (requested !== "staged") return requested;
  if (
    shouldAutoActivateMemory({
      row: { ...input.row, status: "staged" },
      dial: input.dial,
    })
  ) {
    return "active";
  }
  return "staged";
}
