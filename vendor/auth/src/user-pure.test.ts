import { describe, expect, it } from "vitest";
import { googleProfileToUser } from "./user-pure.js";

describe("googleProfileToUser", () => {
  it("maps profile to member user", () => {
    const user = googleProfileToUser({
      sub: "google-123",
      email: "you@example.com",
      name: "You",
    });
    expect(user).toEqual({
      id: "google-123",
      email: "you@example.com",
      name: "You",
      role: "MEMBER",
    });
  });
});
