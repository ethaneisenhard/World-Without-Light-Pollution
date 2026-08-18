import { describe, expect, it } from "vitest";
import { canViewContent } from "./visibility-pure.js";
import type { AuthUser } from "./types.js";

const member: AuthUser = { id: "1", email: "m@x.com", role: "MEMBER" };
const sub: AuthUser = { id: "2", email: "s@x.com", role: "SUBSCRIBER" };

describe("canViewContent", () => {
  it("public always", () => {
    expect(canViewContent(null, "public")).toBe(true);
    expect(canViewContent(member, "public")).toBe(true);
  });

  it("members requires signed-in member or subscriber", () => {
    expect(canViewContent(null, "members")).toBe(false);
    expect(canViewContent(member, "members")).toBe(true);
    expect(canViewContent(sub, "members")).toBe(true);
  });

  it("subscribers requires subscriber role", () => {
    expect(canViewContent(member, "subscribers")).toBe(false);
    expect(canViewContent(sub, "subscribers")).toBe(true);
  });
});
