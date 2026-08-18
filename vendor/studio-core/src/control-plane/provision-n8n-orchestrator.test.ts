import { describe, expect, it, vi } from "vitest";
import { createDeployment, createTenant } from "./tenant-deployment-pure.js";
import {
  DEFAULT_N8N_IMAGE,
  provisionN8nOrchestrator,
} from "./provision-n8n-orchestrator.js";

describe("provisionN8nOrchestrator", () => {
  it("dry-run stamps workflows.{slug}.glassboxcomputer.site", async () => {
    const tenant = createTenant({
      id: "tenant_usern8n01",
      slug: "cosmic-otter-n8n0",
      displayName: "n8n test",
    });
    if ("error" in tenant) throw new Error(tenant.error);
    const deployment = createDeployment({
      id: "deploy_n8n",
      tenantId: tenant.id,
      sidecarIds: ["host", "worker", "n8n"],
    });
    const out = await provisionN8nOrchestrator(
      {
        fetch: async () => new Response("nope", { status: 500 }),
        apiToken: "dry",
      },
      {
        jobId: "job_n8n",
        tenant,
        deployment,
        dryRun: true,
      },
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.resourceUrl).toBe(
      "https://workflows.cosmic-otter-n8n0.glassboxcomputer.site",
    );
    expect(out.flyApp).toContain("-n8n");
    expect(out.deployment.resources.some((r) => r.sidecarId === "n8n")).toBe(
      true,
    );
    expect(out.deployment.resources.find((r) => r.sidecarId === "n8n")?.url).toBe(
      out.resourceUrl,
    );
    expect(DEFAULT_N8N_IMAGE).toContain("n8n");
  });

  it("dry-run honors publicUrl override", async () => {
    const tenant = createTenant({
      id: "tenant_usern8n02",
      slug: "plain-slug",
      displayName: "n8n override",
    });
    if ("error" in tenant) throw new Error(tenant.error);
    const deployment = createDeployment({
      id: "deploy_n8n2",
      tenantId: tenant.id,
      sidecarIds: ["n8n"],
    });
    const out = await provisionN8nOrchestrator(
      {
        fetch: async () => new Response("nope", { status: 500 }),
        apiToken: "dry",
      },
      {
        jobId: "job_n8n2",
        tenant,
        deployment,
        dryRun: true,
        publicUrl: "https://bu-custom-n8n.fly.dev/",
      },
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.resourceUrl).toBe("https://bu-custom-n8n.fly.dev");
  });

  it("real path attaches DNS + cert when deps provided", async () => {
    const tenant = createTenant({
      id: "tenant_usern8n03",
      slug: "acme",
      displayName: "acme",
    });
    if ("error" in tenant) throw new Error(tenant.error);
    const deployment = createDeployment({
      id: "deploy_n8n3",
      tenantId: tenant.id,
      sidecarIds: ["n8n"],
    });
    const createDnsCname = vi.fn().mockResolvedValue({
      ok: true,
      id: "dns1",
      name: "workflows.acme",
    });
    const fetchFn = vi.fn(async (url: string | URL, init?: RequestInit) => {
      const u = String(url);
      const method = (init?.method ?? "GET").toUpperCase();
      if (u.endsWith("/v1/apps") && method === "POST") {
        return new Response("{}", { status: 201 });
      }
      if (u.includes("/machines") && method === "GET") {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (u.includes("/ips") && method === "POST") {
        return new Response("{}", { status: 201 });
      }
      if (u.includes("/volumes") && method === "POST") {
        return new Response(JSON.stringify({ id: "vol1" }), { status: 200 });
      }
      if (u.includes("/machines") && method === "POST") {
        return new Response(JSON.stringify({ id: "mach1" }), { status: 200 });
      }
      if (u.includes("/certificates") && method === "POST") {
        return new Response("{}", { status: 201 });
      }
      return new Response("unexpected", { status: 500 });
    });
    const out = await provisionN8nOrchestrator(
      {
        fetch: fetchFn as unknown as typeof fetch,
        apiToken: "fm2_tok",
      },
      {
        jobId: "job_n8n3",
        tenant,
        deployment,
        dryRun: false,
        dns: {
          createDnsCname,
          dns: {
            fetch: async () => new Response("{}", { status: 200 }),
            apiToken: "cf",
          },
          zoneId: "zone1",
        },
      },
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.resourceUrl).toBe(
      "https://workflows.acme.glassboxcomputer.site",
    );
    expect(createDnsCname).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        name: "workflows.acme",
        content: expect.stringContaining("-n8n.fly.dev"),
        proxied: false,
      }),
    );
  });
});
