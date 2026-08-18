/**
 * Operator-facing default harness policy (shell-vs-harness).
 * Pure constants — Host CLI preferred; Kody never out-of-box default.
 */

import {
  BUILTIN_HARNESS_IDS,
  normalizeHarnessIdAlias,
} from "./harness-policy-pure.js";

/** Host default when Cursor CLI is available. */
export const DEFAULT_HARNESS_HOST = BUILTIN_HARNESS_IDS.cursor;

/** Fallback when no Host CLI (API key path). */
export const DEFAULT_HARNESS_API = BUILTIN_HARNESS_IDS.anthropic;

/** Must never be the shipped empty-config default. */
export const OPTIONAL_CLOUD_PEER_HARNESS = BUILTIN_HARNESS_IDS.kody;

export function isOptionalCloudPeerHarness(harnessId: string): boolean {
  return normalizeHarnessIdAlias(harnessId) === OPTIONAL_CLOUD_PEER_HARNESS;
}

/** True if id is an allowed shipped default (not kody). */
export function isShippedDefaultHarnessId(harnessId: string): boolean {
  const id = normalizeHarnessIdAlias(harnessId);
  return id === DEFAULT_HARNESS_HOST || id === DEFAULT_HARNESS_API;
}
