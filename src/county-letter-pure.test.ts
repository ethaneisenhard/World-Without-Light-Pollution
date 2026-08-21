import { describe, expect, it } from "vitest";
import {
  COUNTY_LOOKUP_LINKS,
  countyLetterBody,
  countyLetterMailtoHref,
} from "./county-letter-pure.js";

describe("countyLetterBody", () => {
  it("reads like a neighbor, not a form letter", () => {
    const body = countyLetterBody();
    expect(body).toContain("I live in");
    expect(body).toContain("I'm a neighbor here");
    expect(body).toContain("sleep and health");
    expect(body).toContain("World Without Light Pollution");
    expect(body).toContain("petition");
    expect(body).not.toContain("4000K+");
    expect(body).not.toContain(
      "Fully-shielded, 3000K-or-warmer light with after-hours dimming",
    );
  });

  it("puts real site URLs in the letter when origin is known", () => {
    const body = countyLetterBody({
      siteOrigin: "https://example.com/",
    });
    expect(body).toContain("https://example.com/petition");
    expect(body).toContain("https://example.com/impacts");
    expect(body).not.toContain("https://example.com//");
  });
});

describe("countyLetterMailtoHref", () => {
  it("builds a mailto that opens with the letter", () => {
    const href = countyLetterMailtoHref();
    expect(href.startsWith("mailto:?subject=")).toBe(true);
    expect(href).toContain("body=");
    expect(decodeURIComponent(href)).toContain("I live in");
  });
});

describe("COUNTY_LOOKUP_LINKS", () => {
  it("points at public directories, not a homemade email list", () => {
    expect(COUNTY_LOOKUP_LINKS.map((l) => l.id)).toEqual([
      "usa-elected",
      "usa-local",
      "openstates",
    ]);
    expect(COUNTY_LOOKUP_LINKS[0]?.href).toContain("usa.gov");
  });
});
