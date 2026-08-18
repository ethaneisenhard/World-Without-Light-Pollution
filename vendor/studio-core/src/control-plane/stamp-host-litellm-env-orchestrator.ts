/**
 * After per-tenant LiteLLM provision — stamp Host machine env
 * LITELLM_BASE_URL + LITELLM_API_KEY for that tenant's gateway only.
 */

import { DEFAULT_LITELLM_BASE_URL } from "../chat-completions-provider-pure.js";
import {
  flyListMachines,
  flyMergeMachineEnv,
  type FlyMachinesApiDeps,
} from "./fly-machines-api-orchestrator.js";
import {
  DEFAULT_GATEWAY_SITE_BASE_DOMAIN,
  gatewayUrlBelongsToTenant,
  litellmHostEnvFromGatewayUrl,
  litellmPrivateV1UrlFromFlyApp,
} from "./gateway-hostname-pure.js";
import type { ControlPlaneDeployment } from "./tenant-deployment-pure.js";

export type StampHostLitellmEnvInput = {
  deployment: ControlPlaneDeployment;
  tenantSlug: string;
  gatewayResourceUrl: string;
  /** Omit on machine reuse — stamp URL only, keep existing Host key. */
  apiKey?: string;
  siteBaseDomain?: string;
  dryRun?: boolean;
};

export type StampHostLitellmEnvOutcome =
  | {
      ok: true;
      hostFlyApp: string;
      machineId: string | null;
      env: { LITELLM_BASE_URL: string; LITELLM_API_KEY?: string };
      dryRun?: boolean;
    }
  | { ok: false; error: string };

export async function stampHostLitellmEnvOrchestrator(
  deps: FlyMachinesApiDeps,
  input: StampHostLitellmEnvInput,
): Promise<StampHostLitellmEnvOutcome> {
  const key = input.apiKey?.trim() ?? "";
  if (
    !gatewayUrlBelongsToTenant(
      input.gatewayResourceUrl,
      input.tenantSlug,
      input.siteBaseDomain ?? DEFAULT_GATEWAY_SITE_BASE_DOMAIN,
    )
  ) {
    return { ok: false, error: "cross_tenant_gateway" };
  }

  const litellmFlyApp = input.deployment.resources
    .find((r) => r.sidecarId === "litellm")
    ?.flyApp?.trim();
  const apiUrl =
    (litellmFlyApp ? litellmPrivateV1UrlFromFlyApp(litellmFlyApp) : null) ??
    DEFAULT_LITELLM_BASE_URL;

  const env = litellmHostEnvFromGatewayUrl(apiUrl, key || undefined);
  if (!env) {
    return { ok: false, error: "gateway_resource_url_invalid" };
  }

  const host = input.deployment.resources.find((r) => r.sidecarId === "host");
  const hostFlyApp = host?.flyApp?.trim();
  if (!hostFlyApp) {
    return { ok: false, error: "host_fly_app_missing" };
  }

  if (input.dryRun) {
    return {
      ok: true,
      hostFlyApp,
      machineId: null,
      env: {
        LITELLM_BASE_URL: env.LITELLM_BASE_URL,
        ...(env.LITELLM_API_KEY
          ? { LITELLM_API_KEY: env.LITELLM_API_KEY }
          : {}),
      },
      dryRun: true,
    };
  }

  const patch: { LITELLM_BASE_URL: string; LITELLM_API_KEY?: string } = {
    LITELLM_BASE_URL: env.LITELLM_BASE_URL,
  };
  if (env.LITELLM_API_KEY) patch.LITELLM_API_KEY = env.LITELLM_API_KEY;

  const listed = await flyListMachines(deps, { appName: hostFlyApp });
  if (!listed.ok) return { ok: false, error: listed.error };
  const live =
    listed.machines.find((m) =>
      /^(started|starting|created|replacing|stopped)$/i.test(m.state),
    ) ?? listed.machines[0];
  if (!live) return { ok: false, error: "host_machine_missing" };

  const merged = await flyMergeMachineEnv(deps, {
    appName: hostFlyApp,
    machineId: live.id,
    env: patch,
  });
  if (!merged.ok) return { ok: false, error: merged.error };

  return {
    ok: true,
    hostFlyApp,
    machineId: merged.machineId,
    env: patch,
  };
}
