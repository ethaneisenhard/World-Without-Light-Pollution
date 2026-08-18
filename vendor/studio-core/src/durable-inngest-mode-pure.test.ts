import { describe, expect, it } from "vitest";
import {
  INNGEST_DURABLE_SIGNAL_EVENT,
  resolveInngestEventApiBase,
  resolveInngestEventKey,
  useInngestDevServer,
} from "./durable-inngest-mode-pure.js";

describe("durable-inngest-mode-pure", () => {
  it("USE_SERVER / BASE_URL enable Dev Server; STUB wins", () => {
    expect(useInngestDevServer(() => undefined)).toBe(false);
    expect(
      useInngestDevServer((k) => (k === "INNGEST_USE_SERVER" ? "1" : undefined)),
    ).toBe(true);
    expect(
      useInngestDevServer((k) =>
        k === "INNGEST_BASE_URL" ? "http://127.0.0.1:8288" : undefined,
      ),
    ).toBe(true);
    expect(
      useInngestDevServer((k) => {
        if (k === "INNGEST_STUB") return "1";
        if (k === "INNGEST_USE_SERVER") return "1";
        return undefined;
      }),
    ).toBe(false);
  });

  it("resolves local event API + dummy key", () => {
    const env = (k: string) =>
      k === "INNGEST_USE_SERVER" ? "1" : undefined;
    expect(resolveInngestEventApiBase(env)).toBe("http://127.0.0.1:8288");
    expect(resolveInngestEventKey(env)).toBe("local");
    expect(INNGEST_DURABLE_SIGNAL_EVENT).toBe("task/approved");
  });
});
