import { describe, expect, it } from "vitest";
import { PLATFORM_STUDIO_PRIMARY_SLUG } from "./reserved-tenant-slugs-pure.js";
import {
  boundLitellmBaseUrlForHost,
  DEFAULT_GATEWAY_SITE_BASE_DOMAIN,
  gatewayUrlBelongsToTenant,
  litellmHostEnvFromGatewayUrl,
  litellmPrivateV1UrlFromFlyApp,
  parsePlatformGatewaySlug,
  PLATFORM_PRIMARY_GATEWAY_UI_URL,
  PLATFORM_PRIMARY_GATEWAY_URL,
  PLATFORM_PRIMARY_GATEWAY_V1_URL,
  platformGatewayDnsRecordName,
  platformGatewayHostname,
  platformGatewayUiUrl,
  platformGatewayUrl,
  platformGatewayUrlFromStudioHostname,
  platformGatewayV1Url,
} from "./gateway-hostname-pure.js";

describe("gateway-hostname-pure", () => {
  it("builds nested gateway.{slug}.glassboxcomputer.site", () => {
    expect(platformGatewayHostname("acme")).toBe(
      "gateway.acme.glassboxcomputer.site",
    );
    expect(platformGatewayUrl("acme")).toBe(
      "https://gateway.acme.glassboxcomputer.site",
    );
    expect(platformGatewayV1Url("acme")).toBe(
      "https://gateway.acme.glassboxcomputer.site/v1",
    );
    expect(platformGatewayUiUrl("acme")).toBe(
      "https://gateway.acme.glassboxcomputer.site/ui",
    );
    expect(DEFAULT_GATEWAY_SITE_BASE_DOMAIN).toBe("glassboxcomputer.site");
  });

  it("primary auth shell → gateway.auth.…site", () => {
    expect(PLATFORM_STUDIO_PRIMARY_SLUG).toBe("auth");
    expect(platformGatewayUrl("auth")).toBe(
      "https://gateway.auth.glassboxcomputer.site",
    );
    expect(PLATFORM_PRIMARY_GATEWAY_URL).toBe(
      "https://gateway.auth.glassboxcomputer.site",
    );
    expect(PLATFORM_PRIMARY_GATEWAY_V1_URL).toBe(
      "https://gateway.auth.glassboxcomputer.site/v1",
    );
    expect(PLATFORM_PRIMARY_GATEWAY_UI_URL).toBe(
      "https://gateway.auth.glassboxcomputer.site/ui",
    );
    expect(
      platformGatewayUrlFromStudioHostname("auth.glassboxcomputer.site"),
    ).toBe("https://gateway.auth.glassboxcomputer.site");
    expect(
      platformGatewayUrlFromStudioHostname("acme.glassboxcomputer.site"),
    ).toBe("https://gateway.acme.glassboxcomputer.site");
    expect(
      platformGatewayUrlFromStudioHostname("gateway.glassboxcomputer.site"),
    ).toBeNull();
    expect(
      platformGatewayUrlFromStudioHostname("api.glassboxcomputer.site"),
    ).toBeNull();
  });

  it("rejects empty / invalid slug", () => {
    expect(platformGatewayHostname("")).toBeNull();
    expect(platformGatewayHostname("!!!")).toBeNull();
    expect(platformGatewayUrl("")).toBeNull();
    expect(platformGatewayDnsRecordName("")).toBeNull();
    expect(
      platformGatewayUrlFromStudioHostname("glassboxcomputer.site"),
    ).toBeNull();
  });

  it("normalizes base domain and builds DNS record name", () => {
    expect(
      platformGatewayHostname("Acme-Co", "https://Glassboxcomputer.site/"),
    ).toBe("gateway.acme-co.glassboxcomputer.site");
    expect(platformGatewayDnsRecordName("auth")).toBe("gateway.auth");
  });

  it("projects Host LITELLM_BASE_URL from resource", () => {
    expect(
      litellmHostEnvFromGatewayUrl(
        "https://gateway.auth.glassboxcomputer.site/",
        "sk-test",
      ),
    ).toEqual({
      LITELLM_BASE_URL: "https://gateway.auth.glassboxcomputer.site/v1",
      LITELLM_API_KEY: "sk-test",
    });
    expect(
      litellmHostEnvFromGatewayUrl(
        "https://gateway.auth.glassboxcomputer.site/v1",
      ),
    ).toEqual({
      LITELLM_BASE_URL: "https://gateway.auth.glassboxcomputer.site/v1",
    });
    expect(litellmHostEnvFromGatewayUrl("not-a-url")).toBeNull();
  });

  it("parses gateway.{slug} and binds Host to own site only", () => {
    expect(
      parsePlatformGatewaySlug(
        "https://gateway.acme.glassboxcomputer.site/v1",
      ),
    ).toBe("acme");
    expect(parsePlatformGatewaySlug("gateway.glassboxcomputer.site")).toBeNull();
    expect(
      gatewayUrlBelongsToTenant(
        "https://gateway.acme.glassboxcomputer.site",
        "acme",
      ),
    ).toBe(true);
    expect(
      gatewayUrlBelongsToTenant(
        "https://gateway.auth.glassboxcomputer.site",
        "acme",
      ),
    ).toBe(false);

    expect(
      boundLitellmBaseUrlForHost({
        configuredBaseUrl: "https://gateway.acme.glassboxcomputer.site",
        hostPublicUrl: "https://api.acme.glassboxcomputer.site",
      }),
    ).toEqual({ ok: false, error: "cross_tenant" });
    expect(
      boundLitellmBaseUrlForHost({
        configuredBaseUrl: "https://gateway.auth.glassboxcomputer.site/v1",
        hostPublicUrl: "https://api.acme.glassboxcomputer.site",
      }),
    ).toEqual({ ok: false, error: "cross_tenant" });
    expect(
      boundLitellmBaseUrlForHost({
        configuredBaseUrl: "http://127.0.0.1:4000/v1",
        hostPublicUrl: "https://api.acme.glassboxcomputer.site",
      }),
    ).toEqual({ ok: true, baseUrl: "http://127.0.0.1:4000/v1" });
    expect(
      boundLitellmBaseUrlForHost({
        configuredBaseUrl: "http://bu-acme-litellm.internal:4000/v1",
        hostPublicUrl: "https://api.acme.glassboxcomputer.site",
        litellmFlyApp: "bu-acme-litellm",
      }),
    ).toEqual({
      ok: true,
      baseUrl: "http://bu-acme-litellm.internal:4000/v1",
    });
    expect(
      boundLitellmBaseUrlForHost({
        configuredBaseUrl: "http://127.0.0.1:4000/v1",
        hostPublicUrl: "http://127.0.0.1:3847",
      }),
    ).toEqual({ ok: true, baseUrl: "http://127.0.0.1:4000/v1" });
    expect(
      boundLitellmBaseUrlForHost({
        hostPublicUrl: "https://api.auth.glassboxcomputer.site",
      }),
    ).toEqual({
      ok: true,
      baseUrl: "http://127.0.0.1:4000/v1",
    });
    expect(litellmPrivateV1UrlFromFlyApp("bu-acme-litellm")).toBe(
      "http://bu-acme-litellm.internal:4000/v1",
    );
  });
});
