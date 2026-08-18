import { describe, expect, it } from "vitest";
import {
  isReservedTenantSlug,
  PLATFORM_STUDIO_PRIMARY_SLUG,
  platformStudioPrimaryOrigin,
  RESERVED_TENANT_SLUG_STEMS,
} from "./reserved-tenant-slugs-pure.js";

describe("reserved-tenant-slugs-pure", () => {
  it("reserves main dogfood + common platform labels", () => {
    expect(PLATFORM_STUDIO_PRIMARY_SLUG).toBe("auth");
    expect(isReservedTenantSlug("auth")).toBe(true);
    expect(isReservedTenantSlug("main")).toBe(true);
    expect(isReservedTenantSlug("API")).toBe(true);
    expect(isReservedTenantSlug("www")).toBe(true);
    expect(isReservedTenantSlug("workflows")).toBe(true);
    expect(RESERVED_TENANT_SLUG_STEMS.has("studio")).toBe(true);
  });

  it("allows customer-looking stems", () => {
    expect(isReservedTenantSlug("acme")).toBe(false);
    expect(isReservedTenantSlug("plucky-fox")).toBe(false);
  });

  it("builds primary Studio origin", () => {
    expect(platformStudioPrimaryOrigin("glassboxcomputer.site")).toBe(
      "https://auth.glassboxcomputer.site",
    );
  });
});
