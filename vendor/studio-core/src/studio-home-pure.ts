/**
 * Host operator home — prefer `~/.glassbox-studio`, fall back to `~/.agent-studio`.
 * Explicit `GLASSBOX_STUDIO_HOME` / `AGENT_STUDIO_HOME` always wins.
 * ADR-0020 Phase 4 slice.
 */

export const STUDIO_HOME_DIRNAME_PREFERRED = ".glassbox-studio";
export const STUDIO_HOME_DIRNAME_LEGACY = ".agent-studio";

export type ResolveStudioHomeInput = {
  /** Absolute override (env). */
  envOverride?: string | null;
  homeDir: string;
  /** Sync existence probes for preferred / legacy dirs under homeDir. */
  preferredExists: boolean;
  legacyExists: boolean;
};

/**
 * Pure path pick — no fs. Callers pass existence flags.
 * New installs (neither exists) → preferred `.glassbox-studio`.
 */
export function resolveStudioHomePath(input: ResolveStudioHomeInput): string {
  const override = (input.envOverride ?? "").trim();
  if (override) return override;

  const home = (input.homeDir ?? "").trim() || ".";
  const preferred = `${home.replace(/\/$/, "")}/${STUDIO_HOME_DIRNAME_PREFERRED}`;
  const legacy = `${home.replace(/\/$/, "")}/${STUDIO_HOME_DIRNAME_LEGACY}`;

  if (input.preferredExists) return preferred;
  if (input.legacyExists) return legacy;
  return preferred;
}
