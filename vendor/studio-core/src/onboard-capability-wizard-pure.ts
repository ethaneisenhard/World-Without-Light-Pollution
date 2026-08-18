/**
 * Onboard stack picker + Connect wall projections (pure).
 */

import {
  CAPABILITY_STACKS,
  type CapabilityStackPack,
} from "./capability-catalog-pure.js";
import type { CapabilityRuntimeState } from "./capability-state-pure.js";
import {
  projectHarnessSettingsCards,
  type HarnessSettingsCard,
} from "./capability-settings-pure.js";

export const DEFAULT_ONBOARD_STACK_ID = "api-only";

export function listOnboardStacks(): readonly CapabilityStackPack[] {
  return CAPABILITY_STACKS;
}

export function recommendedOnboardStackId(input?: {
  cloudHost?: boolean;
}): string {
  if (input?.cloudHost !== false) return DEFAULT_ONBOARD_STACK_ID;
  return DEFAULT_ONBOARD_STACK_ID;
}

export function toggleOnboardStackSelection(
  selected: readonly string[],
  stackId: string,
): string[] {
  const id = stackId.trim();
  if (!id) return [...selected];
  if (selected.includes(id)) return selected.filter((s) => s !== id);
  return [...selected, id];
}

/** Cards that still need Connect after install (auth not ok). */
export function projectOnboardConnectWall(input: {
  states: readonly CapabilityRuntimeState[];
  defaultHarness?: string;
}): HarnessSettingsCard[] {
  const cards = projectHarnessSettingsCards({
    states: input.states,
    defaultHarness: input.defaultHarness ?? "studio",
  });
  return cards.filter(
    (c) =>
      c.action === "connect" ||
      (c.installed && !c.authOk) ||
      c.readinessStatus === "needs-setup",
  );
}

export function onboardWizardStep(input: {
  phase: "pick" | "installing" | "connect" | "done";
  connectCount: number;
}): "pick" | "installing" | "connect" | "done" {
  switch (input.phase) {
    case "pick":
    case "installing":
    case "done":
      return input.phase;
    case "connect":
      return input.connectCount > 0 ? "connect" : "done";
    default: {
      const _exhaustive: never = input.phase;
      return _exhaustive;
    }
  }
}
