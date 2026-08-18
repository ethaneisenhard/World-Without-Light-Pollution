import { describe, expect, it } from "vitest";
import {
  composeTenantSlug,
  stemFromTenantSlug,
  tenantSlugUidSuffix,
  whimsicalStemFromSeed,
  whimsicalTenantSlug,
} from "./tenant-slug-whimsy-pure.js";

describe("tenant-slug-whimsy-pure", () => {
  it("uid suffix is stable 4 chars from user id", () => {
    expect(tenantSlugUidSuffix("user_c8a63f7557484985")).toBe("c8a6");
    expect(tenantSlugUidSuffix("userc8a6")).toBe("c8a6");
  });

  it("whimsy stem is deterministic for a seed", () => {
    expect(whimsicalStemFromSeed("user_aaa")).toBe(
      whimsicalStemFromSeed("user_aaa"),
    );
    expect(whimsicalStemFromSeed("user_aaa")).toMatch(/^[a-z]+-[a-z]+$/);
  });

  it("compose always appends uid", () => {
    expect(composeTenantSlug("cosmic-otter", "user_c8a63f75")).toBe(
      "cosmic-otter-c8a6",
    );
    expect(composeTenantSlug("dogfood", "user_c8a63f75")).toBeNull();
    expect(composeTenantSlug("main", "user_c8a63f75")).toBeNull();
    expect(composeTenantSlug("auth", "user_c8a63f75")).toBeNull();
  });

  it("whimsicalTenantSlug prefers stem hint + uid", () => {
    expect(
      whimsicalTenantSlug({
        userId: "user_c8a63f7557484985",
        stemHint: "Plucky Fox!",
      }),
    ).toBe("plucky-fox-c8a6");
  });

  it("stemFromTenantSlug strips uid for editor", () => {
    expect(stemFromTenantSlug("amber-fox-c8a6")).toBe("amber-fox");
  });
});
