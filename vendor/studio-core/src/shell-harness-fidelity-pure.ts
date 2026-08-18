/**
 * Shell harness fidelity — picked peer id must survive Host prepare.
 * ADR 0008: never silent image→studio/anthropic hijack.
 * Pure: no I/O.
 */

import {
  COMPOSER_HARNESS_IDS,
  normalizeHarnessIdAlias,
} from "./harness-policy-pure.js";
import { visionModeForHarness } from "./harness-vision-pure.js";

/** Composer peers that Host prepare must not rewrite. */
export const SHELL_FIDELITY_PEER_IDS = COMPOSER_HARNESS_IDS;

/**
 * Effective harness after prepare = alias normalize only.
 * Vision / attachments must never change the id (ADR 0008).
 */
export function effectiveHarnessIdAfterPrepare(pickedHarnessId: string): string {
  return normalizeHarnessIdAlias(pickedHarnessId);
}

/**
 * True when prepare would illegally swap the operator-picked harness.
 * Allowed: legacy `studio` → `anthropic` alias only.
 */
export function isForbiddenHarnessHijack(
  pickedHarnessId: string,
  effectiveHarnessId: string,
): boolean {
  const expected = effectiveHarnessIdAfterPrepare(pickedHarnessId);
  return effectiveHarnessId.trim() !== expected;
}

/** Vision prepare outcome that preserves picker identity (no hijack). */
export function visionPreparePreservesHarness(
  pickedHarnessId: string,
  hasImages: boolean,
): { harnessId: string; mustFail: boolean; mode: string } {
  const harnessId = effectiveHarnessIdAfterPrepare(pickedHarnessId);
  const mode = visionModeForHarness(harnessId);
  const mustFail = hasImages && mode === "unsupported";
  return { harnessId, mustFail, mode };
}
