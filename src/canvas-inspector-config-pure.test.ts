import { describe, expect, it } from "vitest";
import {
  isDevSiteHost,
  shouldStripAuthoringAttrs,
} from "./canvas-inspector-config-pure.js";

describe("isDevSiteHost", () => {
  it("matches local hosts", () => {
    expect(isDevSiteHost("127.0.0.1")).toBe(true);
    expect(isDevSiteHost("localhost")).toBe(true);
    expect(isDevSiteHost("demo.localhost")).toBe(true);
    expect(isDevSiteHost("northline.example")).toBe(false);
  });
});

describe("shouldStripAuthoringAttrs", () => {
  it("keeps attrs in Studio preview", () => {
    expect(
      shouldStripAuthoringAttrs({
        isStudioPreview: true,
        config: { stripAttrs: true },
      }),
    ).toBe(false);
  });

  it("keeps attrs on local ideal-stack preview", () => {
    expect(
      shouldStripAuthoringAttrs({
        isStudioPreview: false,
        isDevSite: true,
        config: { stripAttrs: true },
      }),
    ).toBe(false);
  });

  it("strips on non-local when stripAttrs default", () => {
    expect(
      shouldStripAuthoringAttrs({
        isStudioPreview: false,
        isDevSite: false,
      }),
    ).toBe(true);
  });

  it("opt-out preserves attrs", () => {
    expect(
      shouldStripAuthoringAttrs({
        isStudioPreview: false,
        isDevSite: false,
        config: { stripAttrs: false },
      }),
    ).toBe(false);
  });
});
