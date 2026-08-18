import { describe, expect, it } from "vitest";
import {
  applyHostingProdUrlToProjectConfig,
  normalizePublicSiteUrl,
  projectConfigWithOptionalProdUrl,
} from "./hosting-prod-url-pure.js";

describe("normalizePublicSiteUrl", () => {
  it("clears empty", () => {
    expect(normalizePublicSiteUrl("")).toEqual({ ok: true, value: null });
    expect(normalizePublicSiteUrl("   ")).toEqual({ ok: true, value: null });
  });

  it("adds https when scheme missing", () => {
    expect(normalizePublicSiteUrl("demo.example.com")).toEqual({
      ok: true,
      value: "https://demo.example.com",
    });
  });

  it("keeps http and https", () => {
    expect(normalizePublicSiteUrl("http://127.0.0.1:8080")).toEqual({
      ok: true,
      value: "http://127.0.0.1:8080",
    });
    expect(normalizePublicSiteUrl("https://yoursite.com/")).toEqual({
      ok: true,
      value: "https://yoursite.com",
    });
  });

  it("rejects non-http schemes", () => {
    const r = normalizePublicSiteUrl("ftp://files.example");
    expect(r.ok).toBe(false);
  });
});

describe("applyHostingProdUrlToProjectConfig", () => {
  it("sets and clears prod_url", () => {
    const set = applyHostingProdUrlToProjectConfig(
      { id: "p1", hosting: { provider: "cf" } },
      "https://a.example",
    );
    expect(set.hosting).toEqual({
      provider: "cf",
      prod_url: "https://a.example",
    });
    const cleared = applyHostingProdUrlToProjectConfig(set, null);
    expect(cleared.hosting).toEqual({ provider: "cf" });
  });

  it("drops empty hosting object when clearing sole key", () => {
    const cleared = applyHostingProdUrlToProjectConfig(
      { id: "p1", hosting: { prod_url: "https://x.test" } },
      null,
    );
    expect(cleared.hosting).toBeUndefined();
  });
});

describe("projectConfigWithOptionalProdUrl", () => {
  it("no-ops when undefined", () => {
    const cfg = { id: "p1", hosting: { prod_url: "https://a.test" } };
    expect(projectConfigWithOptionalProdUrl(cfg, undefined)).toBe(cfg);
  });
});
