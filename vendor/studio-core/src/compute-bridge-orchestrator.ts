/**
 * Resolve where a Host API call should execute (ADR 0016).
 * Vault always stays on vault Host; compute may bridge when placement=local|byo.
 */

import {
  classifyHostApiRoute,
  resolveComputeDelegateTarget,
  type ComputeDelegateTarget,
  type HostApiRouteClass,
} from "./compute-bridge-pure.js";
import {
  DEFAULT_CREATE_COMPUTE_PLACEMENT,
  resolveComputePlacement,
  type ComputePlacement,
} from "./compute-placement-pure.js";

export type ComputeBridgeOrchestratorDeps = {
  /** Base URL of laptop compute bridge when placement=local. */
  getLocalBridgeUrl?: () => string | null | Promise<string | null>;
  /** BYO Host API for placement=byo. */
  getByoHostUrl?: (
    runtimeHostId?: string,
  ) => string | null | Promise<string | null>;
};

export type ResolveHostApiDelegateInput = {
  pathOrUrl: string;
  /** Project compute.placement (from project.json). */
  placement?: ComputePlacement | null;
  /** project.json-shaped config — placement read when placement omitted. */
  projectConfig?: { compute?: unknown } | null;
  runtimeHostId?: string | null;
};

export type ResolveHostApiDelegateResult = {
  routeClass: HostApiRouteClass;
  placement: ComputePlacement;
  target: ComputeDelegateTarget;
  /** True when caller must not leave the vault Host. */
  stayOnVaultHost: boolean;
};

export async function resolveHostApiDelegateOrchestrator(
  deps: ComputeBridgeOrchestratorDeps,
  input: ResolveHostApiDelegateInput,
): Promise<ResolveHostApiDelegateResult> {
  const routeClass = classifyHostApiRoute(input.pathOrUrl);
  const placement =
    input.placement ??
    resolveComputePlacement(
      input.projectConfig,
      DEFAULT_CREATE_COMPUTE_PLACEMENT,
    );

  if (routeClass === "vault" || routeClass === "shell") {
    const target = resolveComputeDelegateTarget({
      routeClass,
      placement,
    });
    return {
      routeClass,
      placement,
      target,
      stayOnVaultHost: true,
    };
  }

  let bridgeUrl: string | null = null;
  let byoHostUrl: string | null = null;
  if (placement === "local" && deps.getLocalBridgeUrl) {
    bridgeUrl = await deps.getLocalBridgeUrl();
  }
  if (placement === "byo" && deps.getByoHostUrl) {
    byoHostUrl = await deps.getByoHostUrl(
      input.runtimeHostId ?? undefined,
    );
  }

  const target = resolveComputeDelegateTarget({
    routeClass,
    placement,
    bridgeUrl,
    byoHostUrl,
  });

  return {
    routeClass,
    placement,
    target,
    stayOnVaultHost: target.kind === "vault-host",
  };
}
