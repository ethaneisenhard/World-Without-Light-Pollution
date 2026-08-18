import { describe, expect, it } from "vitest";
import { requireUserRole, userHasRole } from "./roles-pure.js";

describe("userHasRole", () => {
  const subscriber = { id: "1", email: "a@b.com", role: "SUBSCRIBER" as const };

  it("subscriber satisfies MEMBER gate", () => {
    expect(userHasRole(subscriber, "MEMBER")).toBe(true);
  });

  it("subscriber satisfies SUBSCRIBER gate", () => {
    expect(requireUserRole(subscriber, "SUBSCRIBER")).toEqual(subscriber);
  });
});
