import { describe, expect, it } from "vitest";
import {
  BROWSERUI_MARGIN_PERCENT_OF_INFRA,
  estimateHostedReceipt,
  formatUsd,
} from "./hosted-billing-receipt-pure.js";

describe("hosted-billing-receipt-pure", () => {
  it("studio-cloud receipt splits infra + margin", () => {
    const r = estimateHostedReceipt({ packId: "studio-cloud" });
    if ("error" in r) throw new Error(r.error);
    expect(r.lines.some((l) => l.kind === "infra")).toBe(true);
    expect(r.lines.some((l) => l.kind === "margin")).toBe(true);
    expect(r.marginPercentOfInfra).toBe(BROWSERUI_MARGIN_PERCENT_OF_INFRA);
    expect(r.customerTotalUsd).toBeCloseTo(r.infraTotalUsd + r.marginUsd, 2);
    expect(r.footnotes.some((f) => /cutover|ADR/i.test(f))).toBe(true);
    expect(formatUsd(r.customerTotalUsd)).toMatch(/^\$/);
  });

  it("studio-automate costs more than studio-cloud", () => {
    const a = estimateHostedReceipt({ packId: "studio-cloud" });
    const b = estimateHostedReceipt({ packId: "studio-automate" });
    if ("error" in a || "error" in b) throw new Error("bad");
    expect(b.customerTotalUsd).toBeGreaterThan(a.customerTotalUsd);
  });
});
