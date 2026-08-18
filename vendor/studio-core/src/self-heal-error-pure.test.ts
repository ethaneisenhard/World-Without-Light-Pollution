import { describe, expect, it } from "vitest";
import {
  decideSelfHealAuto,
  selfHealErrorSignature,
  summarizeSelfHealPrompt,
} from "./self-heal-error-pure.ts";

describe("summarizeSelfHealPrompt", () => {
  it("includes source, title, detail, and fix ask", () => {
    const p = summarizeSelfHealPrompt({
      source: "live-preview",
      title: "Preview failed to start in the cloud",
      detail: "ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND No package.json",
      context: ["project: demo-blog"],
    });
    expect(p).toMatch(/Studio error — please fix/);
    expect(p).toMatch(/live-preview/);
    expect(p).toMatch(/package\.json/);
    expect(p).toMatch(/project: demo-blog/);
    expect(p).toMatch(/Diagnose and fix/);
    expect(p).not.toMatch(/\bHost\b/);
  });
});

describe("selfHealErrorSignature", () => {
  it("stable for same payload", () => {
    const a = selfHealErrorSignature({
      source: "client",
      title: "boom",
      detail: "x",
    });
    const b = selfHealErrorSignature({
      source: "client",
      title: "boom",
      detail: "x",
    });
    expect(a).toBe(b);
  });
});

describe("decideSelfHealAuto", () => {
  it("skips when disabled", () => {
    expect(
      decideSelfHealAuto({
        enabled: false,
        signature: "a",
        lastSignature: "",
        lastAt: 0,
        now: 1000,
      }),
    ).toBe("skip_disabled");
  });

  it("fires when enabled and new", () => {
    expect(
      decideSelfHealAuto({
        enabled: true,
        signature: "a",
        lastSignature: "",
        lastAt: 0,
        now: 1000,
      }),
    ).toBe("fire");
  });

  it("cools down same signature", () => {
    expect(
      decideSelfHealAuto({
        enabled: true,
        signature: "a",
        lastSignature: "a",
        lastAt: 900,
        now: 1000,
        cooldownMs: 60_000,
      }),
    ).toBe("skip_cooldown");
  });
});
