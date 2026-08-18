/**
 * remix/ui adapter helpers — map draft → Handle props; resolve adapter from registry.
 */

import type { SandboxRegistry } from "../registry-pure.js";
import type { SandboxInspectorDraft } from "../draft-pure.js";
import type { RemixSandboxAdapter } from "../types.js";

export type { RemixSandboxAdapter };

export function getRemixAdapter(
  registry: SandboxRegistry,
  id: string,
): RemixSandboxAdapter | null {
  return registry.get(id)?.adapters?.remix ?? null;
}

export function remixPropsFromDraft(
  registry: SandboxRegistry,
  id: string,
  draft: SandboxInspectorDraft,
): Record<string, unknown> | null {
  const adapter = getRemixAdapter(registry, id);
  if (!adapter) return null;
  return adapter.mapDraftToProps(draft);
}

/**
 * Build a remix adapter from a Handle component + prop mapper.
 * Keeps registration terse for projects.
 */
export function defineRemixAdapter(input: {
  Component: RemixSandboxAdapter["Component"];
  mapDraftToProps: RemixSandboxAdapter["mapDraftToProps"];
}): RemixSandboxAdapter {
  return {
    Component: input.Component,
    mapDraftToProps: input.mapDraftToProps,
  };
}
