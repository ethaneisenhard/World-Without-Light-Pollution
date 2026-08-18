import { describe, expect, it } from "vitest";
import {
  accessModeCapabilities,
  accessModeCards,
  accessModeChipLabel,
} from "./access-mode-ui-pure.js";

describe("accessModeCapabilities", () => {
  it("full access turns on auto-approve; allowlists off; file roots on", () => {
    const rows = accessModeCapabilities("all");
    expect(rows.find((r) => r.id === "autoApprove")?.on).toBe(true);
    expect(rows.find((r) => r.id === "studioPaths")?.on).toBe(true);
    expect(rows.find((r) => r.id === "toolAllowlist")?.on).toBe(false);
    expect(rows.find((r) => r.id === "shell")?.on).toBe(true);
  });

  it("guarded keeps allowlists on, auto-approve off, file roots still on", () => {
    const rows = accessModeCapabilities("guarded");
    expect(rows.find((r) => r.id === "autoApprove")?.on).toBe(false);
    expect(rows.find((r) => r.id === "studioPaths")?.on).toBe(true);
    expect(rows.find((r) => r.id === "toolAllowlist")?.on).toBe(true);
  });
});

describe("accessModeCards", () => {
  it("returns both modes", () => {
    const cards = accessModeCards();
    expect(cards.map((c) => c.mode)).toEqual(["all", "guarded"]);
    expect(accessModeChipLabel("all")).toBe("Full access");
  });
});
