import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password-pure.js";

describe("password-pure", () => {
  it("round-trips verify", async () => {
    const stored = await hashPassword("dev-pass");
    expect(await verifyPassword("dev-pass", stored)).toBe(true);
    expect(await verifyPassword("wrong", stored)).toBe(false);
  });
});
