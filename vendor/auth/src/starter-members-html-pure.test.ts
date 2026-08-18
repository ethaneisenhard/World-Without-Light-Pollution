import { describe, expect, it } from "vitest";
import {
  renderStarterAccountHtml,
  renderStarterMembersHtml,
} from "./starter-members-html-pure.js";

const user = {
  id: "u1",
  email: "member@example.com",
  name: "Starter Member",
  role: "MEMBER" as const,
};

describe("starter members html", () => {
  it("renders account + members proof chrome with Tailwind tokens", () => {
    const account = renderStarterAccountHtml(user, { brandName: "Northline" });
    expect(account).toContain('data-as-auth="signed-in"');
    expect(account).toContain("Starter Member");
    expect(account).toContain("/members");
    expect(account).toContain("bg-paper");
    expect(account).toContain("rounded-2xl");

    const members = renderStarterMembersHtml(user, { brandName: "Northline" });
    expect(members).toContain("Members only");
    expect(members).toContain("canViewContent");
    expect(members).toContain("/account");
    expect(members).toContain("font-display");
  });
});
