import { describe, expect, it } from "vitest";
import {
  createControlPlaneMemoryStore,
  onboardSignupTenant,
} from "./control-plane-store-pure.js";

describe("onboardSignupTenant", () => {
  it("keeps earlier signup working after a second signup (no shared deploy id)", () => {
    const store = createControlPlaneMemoryStore({ seedDogfood: false });
    const a = onboardSignupTenant(store, {
      userId: "user_aaa1111111111111",
      email: "alice@example.com",
      displayName: "Alice",
    });
    const b = onboardSignupTenant(store, {
      userId: "user_bbb2222222222222",
      email: "bob@example.com",
      displayName: "Bob",
    });
    if (!a.ok || !b.ok) throw new Error("onboard failed");
    expect(a.tenant.shortId).not.toBe(b.tenant.shortId);
    expect(a.deployment.id).not.toBe(b.deployment.id);
    expect(store.listDeployments(a.tenant.id)).toHaveLength(1);
    expect(store.listDeployments(b.tenant.id)).toHaveLength(1);
    // Whimsical stem + uid — not email local-part.
    expect(a.tenant.slug).toMatch(/^[a-z]+-[a-z]+-[a-z0-9]{4}$/);
    expect(a.tenant.slug).not.toContain("alice");
    expect(b.tenant.slug).toMatch(/^[a-z]+-[a-z]+-[a-z0-9]{4}$/);
  });

  it("repairs tenant without deployment", () => {
    const store = createControlPlaneMemoryStore({ seedDogfood: false });
    const first = onboardSignupTenant(store, {
      userId: "user_ccc3333333333333",
      email: "c@example.com",
    });
    if (!first.ok) throw new Error(first.error);
    // Steal deployment the way the prod bug did.
    store.upsertDeployment({
      ...first.deployment,
      id: first.deployment.id,
      tenantId: "other_tenant",
    });
    // Clear by overwriting map entry away from this tenant — simulate empty list.
    const empty = createControlPlaneMemoryStore({ seedDogfood: false });
    empty.upsertTenant(first.tenant, "user_ccc3333333333333");
    const repaired = onboardSignupTenant(empty, {
      userId: "user_ccc3333333333333",
      email: "c@example.com",
    });
    expect(repaired.ok).toBe(true);
    if (!repaired.ok) return;
    expect(empty.listDeployments(first.tenant.id)).toHaveLength(1);
  });
});
