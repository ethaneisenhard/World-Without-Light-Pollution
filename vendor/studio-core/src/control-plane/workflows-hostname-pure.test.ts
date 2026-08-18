import { describe, expect, it } from "vitest";
import { PLATFORM_STUDIO_PRIMARY_SLUG } from "./reserved-tenant-slugs-pure.js";
import {
  DEFAULT_WORKFLOWS_SITE_BASE_DOMAIN,
  n8nHostEnvFromResourceUrl,
  PLATFORM_PRIMARY_WORKFLOWS_URL,
  PLATFORM_SHARED_WORKFLOWS_BASE_URL,
  platformWorkflowsDnsRecordName,
  platformWorkflowsHostname,
  platformWorkflowsUrl,
  platformWorkflowsUrlFromStudioHostname,
} from "./workflows-hostname-pure.js";

describe("workflows-hostname-pure", () => {
  it("builds nested workflows.{slug}.glassboxcomputer.site", () => {
    expect(platformWorkflowsHostname("acme")).toBe(
      "workflows.acme.glassboxcomputer.site",
    );
    expect(platformWorkflowsUrl("acme")).toBe(
      "https://workflows.acme.glassboxcomputer.site",
    );
    expect(DEFAULT_WORKFLOWS_SITE_BASE_DOMAIN).toBe("glassboxcomputer.site");
  });

  it("primary auth shell → workflows.auth.…site", () => {
    expect(PLATFORM_STUDIO_PRIMARY_SLUG).toBe("auth");
    expect(platformWorkflowsUrl("auth")).toBe(
      "https://workflows.auth.glassboxcomputer.site",
    );
    expect(PLATFORM_PRIMARY_WORKFLOWS_URL).toBe(
      "https://workflows.auth.glassboxcomputer.site",
    );
    expect(
      platformWorkflowsUrlFromStudioHostname("auth.glassboxcomputer.site"),
    ).toBe("https://workflows.auth.glassboxcomputer.site");
    expect(
      platformWorkflowsUrlFromStudioHostname("acme.glassboxcomputer.site"),
    ).toBe("https://workflows.acme.glassboxcomputer.site");
    expect(
      platformWorkflowsUrlFromStudioHostname("workflows.glassboxcomputer.site"),
    ).toBeNull();
    expect(
      platformWorkflowsUrlFromStudioHostname("api.glassboxcomputer.site"),
    ).toBeNull();
  });

  it("rejects empty / invalid slug", () => {
    expect(platformWorkflowsHostname("")).toBeNull();
    expect(platformWorkflowsHostname("!!!")).toBeNull();
    expect(platformWorkflowsUrl("")).toBeNull();
    expect(platformWorkflowsDnsRecordName("")).toBeNull();
    expect(platformWorkflowsUrlFromStudioHostname("glassboxcomputer.site")).toBeNull();
  });

  it("normalizes base domain and builds DNS record name", () => {
    expect(
      platformWorkflowsHostname("Acme-Co", "https://Glassboxcomputer.site/"),
    ).toBe("workflows.acme-co.glassboxcomputer.site");
    expect(platformWorkflowsDnsRecordName("auth")).toBe("workflows.auth");
  });

  it("projects Host N8N_BASE_URL from resource", () => {
    expect(
      n8nHostEnvFromResourceUrl(
        "https://workflows.auth.glassboxcomputer.site/",
      ),
    ).toEqual({
      N8N_BASE_URL: "https://workflows.auth.glassboxcomputer.site",
    });
    expect(n8nHostEnvFromResourceUrl("not-a-url")).toBeNull();
    expect(PLATFORM_SHARED_WORKFLOWS_BASE_URL).toBe(
      "https://workflows.glassboxcomputer.com",
    );
  });
});
