import { describe, expect, it } from "vitest";
import { resolveOAuthReturnTo } from "./oauth-return-to-pure.js";

describe("resolveOAuthReturnTo", () => {
  it("expands relative returnTo to tenant absolute URL", () => {
    expect(
      resolveOAuthReturnTo({
        requestUrl: "https://eeisen11.browserui.site/login/google",
        rawReturnTo: "/",
        fallbackPath: "/",
        allowedSiteBaseDomain: "browserui.site",
      }),
    ).toBe("https://eeisen11.browserui.site/");
  });

  it("rejects off-site returnTo", () => {
    expect(
      resolveOAuthReturnTo({
        requestUrl: "https://eeisen11.browserui.site/login/google",
        rawReturnTo: "https://evil.example/",
        fallbackPath: "/",
        allowedSiteBaseDomain: "browserui.site",
      }),
    ).toBe("https://eeisen11.browserui.site/");
  });

  it("keeps relative path when no site base (single origin)", () => {
    expect(
      resolveOAuthReturnTo({
        requestUrl: "http://127.0.0.1:4400/login/google",
        rawReturnTo: "/account",
        fallbackPath: "/",
      }),
    ).toBe("/account");
  });
});
