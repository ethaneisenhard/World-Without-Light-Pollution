import { describe, expect, it } from "vitest";
import {
  byoHostHealthUrl,
  isStudioHostHealthBody,
  parseByoHostUrl,
} from "./byo-host-attach-pure.js";

describe("byo-host-attach-pure", () => {
  it("parses https origin", () => {
    const ok = parseByoHostUrl("https://host.example.com/");
    expect(ok).toEqual({ ok: true, url: "https://host.example.com" });
    expect(byoHostHealthUrl("https://host.example.com")).toBe(
      "https://host.example.com/health",
    );
  });

  it("rejects path and bad protocol", () => {
    expect(parseByoHostUrl("https://x.com/api").ok).toBe(false);
    expect(parseByoHostUrl("ftp://x.com").ok).toBe(false);
  });

  it("recognizes studio health bodies", () => {
    expect(isStudioHostHealthBody({ host: true })).toBe(true);
    expect(isStudioHostHealthBody({ ok: true, service: "studio" })).toBe(true);
    expect(isStudioHostHealthBody({ foo: 1 })).toBe(false);
  });
});
