import { describe, expect, it } from "vitest";
import {
  coerceMcpPlaneId,
  mcpPlaneChoicesForPicker,
  mcpPlaneIncludesKody,
  mcpPlanePickerFace,
  mcpPlaneServerEntries,
  resolveKodyMcpUrl,
} from "./mcp-plane-pure.js";

describe("coerceMcpPlaneId", () => {
  it("defaults to studio+kody (Kent-shaped)", () => {
    expect(coerceMcpPlaneId(undefined)).toBe("studio+kody");
    expect(coerceMcpPlaneId("")).toBe("studio+kody");
    expect(coerceMcpPlaneId("nope")).toBe("studio+kody");
  });

  it("accepts studio alone", () => {
    expect(coerceMcpPlaneId("studio")).toBe("studio");
  });

  it("accepts studio+kody aliases", () => {
    expect(coerceMcpPlaneId("studio+kody")).toBe("studio+kody");
    expect(coerceMcpPlaneId("kody")).toBe("studio+kody");
  });
});

describe("mcpPlaneServerEntries", () => {
  it("studio only", () => {
    expect(
      mcpPlaneServerEntries({
        plane: "studio",
        studioMcpUrl: "http://s/mcp",
        kodyMcpUrl: "http://k/mcp",
      }),
    ).toEqual([{ id: "glassbox-studio", url: "http://s/mcp" }]);
  });

  it("studio+kody when url set", () => {
    expect(
      mcpPlaneServerEntries({
        plane: "studio+kody",
        studioMcpUrl: "http://s/mcp",
        kodyMcpUrl: "http://127.0.0.1:3742/mcp",
      }),
    ).toEqual([
      { id: "glassbox-studio", url: "http://s/mcp" },
      { id: "kody", url: "http://127.0.0.1:3742/mcp" },
    ]);
  });

  it("skips kody when url missing", () => {
    expect(
      mcpPlaneServerEntries({
        plane: "studio+kody",
        studioMcpUrl: "http://s/mcp",
        kodyMcpUrl: null,
      }),
    ).toEqual([{ id: "glassbox-studio", url: "http://s/mcp" }]);
  });
});

describe("resolveKodyMcpUrl", () => {
  it("prefers explicit mcp url", () => {
    expect(
      resolveKodyMcpUrl({
        kodyMcpUrl: "http://x/mcp/",
        kodyBaseUrl: "http://y",
      }),
    ).toBe("http://x/mcp");
  });

  it("derives from base", () => {
    expect(
      resolveKodyMcpUrl({ kodyBaseUrl: "http://127.0.0.1:3742" }),
    ).toBe("http://127.0.0.1:3742/mcp");
  });
});

describe("mcpPlaneChoicesForPicker", () => {
  it("disables kody when not configured", () => {
    const rows = mcpPlaneChoicesForPicker({ kodyConfigured: false });
    expect(mcpPlaneIncludesKody("studio")).toBe(false);
    expect(mcpPlanePickerFace("studio+kody")).toBe("Studio+Kody");
    expect(rows.find((r) => r.id === "studio+kody")?.disabled).toBe(true);
  });
});
