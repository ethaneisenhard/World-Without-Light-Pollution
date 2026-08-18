import { describe, expect, it } from "vitest";
import {
  buildPasswordResetUrl,
  createPasswordResetToken,
  hashPasswordResetToken,
  isPasswordResetExpired,
  passwordResetExpiresAtIso,
} from "./password-reset-pure.js";
import { createMemoryPasswordResetTokenStore } from "./password-reset-store.js";

describe("password-reset-pure", () => {
  it("hashes tokens stably and builds reset URLs", async () => {
    const { raw, hash } = await createPasswordResetToken();
    expect(raw.length).toBeGreaterThan(20);
    expect(await hashPasswordResetToken(raw)).toBe(hash);
    expect(buildPasswordResetUrl("https://browserui.org", raw)).toBe(
      `https://browserui.org/reset-password?token=${encodeURIComponent(raw)}`,
    );
  });

  it("expiry helper", () => {
    const iso = passwordResetExpiresAtIso(1_000);
    expect(isPasswordResetExpired(iso, 1_000)).toBe(false);
    expect(isPasswordResetExpired(iso, 1_000 + 60 * 60 * 1000 + 1)).toBe(true);
  });
});

describe("memory password-reset store", () => {
  it("issues and consumes once", async () => {
    const store = createMemoryPasswordResetTokenStore();
    const { raw } = await store.issue("u1");
    expect(await store.consume(raw)).toBe("u1");
    expect(await store.consume(raw)).toBeNull();
  });
});
