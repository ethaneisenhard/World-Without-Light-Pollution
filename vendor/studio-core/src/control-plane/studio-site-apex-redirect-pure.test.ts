import { describe, expect, it } from "vitest";
import { studioSiteApexCompanyRedirectUrl } from "./studio-site-apex-redirect-pure.js";

describe("studioSiteApexCompanyRedirectUrl", () => {
  it("redirects apex + www to company, keeps path/query", () => {
    expect(
      studioSiteApexCompanyRedirectUrl({
        hostHeader: "glassboxcomputer.site",
        siteBaseDomain: "glassboxcomputer.site",
        companyOrigin: "https://glassboxcomputer.com",
        pathname: "/pricing",
        search: "?ref=nav",
      }),
    ).toBe("https://glassboxcomputer.com/pricing?ref=nav");

    expect(
      studioSiteApexCompanyRedirectUrl({
        hostHeader: "www.glassboxcomputer.site",
        siteBaseDomain: "glassboxcomputer.site",
        companyOrigin: "https://glassboxcomputer.com",
        pathname: "/",
        search: "",
      }),
    ).toBe("https://glassboxcomputer.com/");
  });

  it("leaves tenant shells alone", () => {
    expect(
      studioSiteApexCompanyRedirectUrl({
        hostHeader: "acme.glassboxcomputer.site",
        siteBaseDomain: "glassboxcomputer.site",
        companyOrigin: "https://glassboxcomputer.com",
        pathname: "/",
        search: "",
      }),
    ).toBeNull();
  });

  it("skips redirect on loopback request hostname (local wrangler dogfood)", () => {
    expect(
      studioSiteApexCompanyRedirectUrl({
        hostHeader: "glassboxcomputer.site",
        siteBaseDomain: "glassboxcomputer.site",
        companyOrigin: "https://glassboxcomputer.com",
        pathname: "/",
        search: "",
        requestHostname: "127.0.0.1",
      }),
    ).toBeNull();
  });
});
