import { describe, expect, it } from "vitest";
import { projectConsoleStackSummary } from "./console-readiness-pure.js";
import {
  createDeployment,
  createTenant,
  mergeDeploymentResources,
} from "./tenant-deployment-pure.js";

describe("projectConsoleStackSummary", () => {
  it("explains host attached without Studio UI Worker", () => {
    const tenant = createTenant({
      id: "tenant_user6cde8b2421a2",
      slug: "eeisen11",
      displayName: "Ethan",
    });
    if ("error" in tenant) throw new Error(tenant.error);
    const deployment = mergeDeploymentResources(
      createDeployment({
        id: "d1",
        tenantId: tenant.id,
        sidecarIds: ["worker", "host"],
      }),
      [
        {
          sidecarId: "host",
          url: "https://bu-user6cde-host.fly.dev",
          flyApp: "bu-user6cde-host",
        },
      ],
    );
    const summary = projectConsoleStackSummary(deployment);
    expect(summary.studioOpenReady).toBe(false);
    expect(summary.hostUrl).toBe("https://bu-user6cde-host.fly.dev");
    expect(summary.workerUrl).toBeNull();
    expect(summary.headline).toMatch(/API host attached/i);
    expect(summary.studioOpenBlockedReason).toMatch(/not the shell/i);
    const host = summary.rows.find((r) => r.sidecarId === "host");
    const worker = summary.rows.find((r) => r.sidecarId === "worker");
    expect(host?.linkKind).toBe("api_host");
    expect(host?.state).toBe("attached");
    expect(worker?.state).toBe("not_provisioned");
    expect(worker?.canProvision).toBe(true);
    expect(worker?.provisionActionLabel).toMatch(/Studio UI/i);
  });

  it("enables Open Studio when worker URL attached", () => {
    const tenant = createTenant({
      id: "tenant_abc",
      slug: "acme",
      displayName: "Acme",
    });
    if ("error" in tenant) throw new Error(tenant.error);
    const deployment = mergeDeploymentResources(
      createDeployment({ id: "d1", tenantId: tenant.id }),
      [
        {
          sidecarId: "host",
          url: "https://bu-acme-host.fly.dev",
        },
        {
          sidecarId: "worker",
          url: "https://acme.workers.dev",
        },
      ],
    );
    const summary = projectConsoleStackSummary(deployment);
    expect(summary.studioOpenReady).toBe(true);
    expect(summary.workerUrl).toBe("https://acme.workers.dev");
  });
});
