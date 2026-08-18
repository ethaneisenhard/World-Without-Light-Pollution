import { describe, expect, it } from "vitest";
import {
  heuristicHostHealPlan,
  matchHostHealCommand,
  resolveHostDownFace,
  shouldAutoStartHostHeal,
} from "./host-heal-pure.js";
import { runHostHealOrchestrator } from "./host-heal-orchestrator.js";

describe("matchHostHealCommand", () => {
  it("allows journalctl and pnpm install", () => {
    expect(matchHostHealCommand("journalctl -u studio-serve -n 80 --no-pager").ok).toBe(
      true,
    );
    expect(
      matchHostHealCommand("cd /opt/glassbox-studio && pnpm install --no-frozen-lockfile")
        .ok,
    ).toBe(true);
    expect(matchHostHealCommand("rm -rf /").ok).toBe(false);
  });
});

describe("heuristicHostHealPlan", () => {
  it("installs when marked missing", () => {
    const plan = heuristicHostHealPlan(
      "Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'marked'",
    );
    expect(plan[0]).toContain("pnpm install");
    expect(plan.some((c) => c.includes("restart"))).toBe(true);
  });
});

describe("resolveHostDownFace", () => {
  it("gates faces", () => {
    expect(resolveHostDownFace({ hostHealthy: true, job: null })).toBe("hidden");
    expect(
      resolveHostDownFace({
        hostHealthy: false,
        job: { phase: "diagnosing" },
      }),
    ).toBe("healing");
    expect(
      resolveHostDownFace({ hostHealthy: false, job: { phase: "failed" } }),
    ).toBe("failed");
  });
});

describe("shouldAutoStartHostHeal", () => {
  it("dedupes within window", () => {
    expect(
      shouldAutoStartHostHeal({
        lastAutoStartedAt: 1000,
        now: 2000,
        windowMs: 60_000,
        lastJobPhase: "failed",
      }),
    ).toBe(false);
    expect(
      shouldAutoStartHostHeal({
        lastAutoStartedAt: null,
        now: 2000,
        lastJobPhase: null,
      }),
    ).toBe(true);
  });
});

describe("runHostHealOrchestrator", () => {
  it("replays missing-module → install → restart → healthy", async () => {
    const calls: string[] = [];
    const { report } = await runHostHealOrchestrator(
      {
        exec: async (command) => {
          calls.push(command);
          if (command.includes("journalctl")) {
            return {
              ok: false,
              code: 0,
              stdout: "",
              stderr:
                "Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'marked' imported from chat-markdown-pure.ts",
            };
          }
          return { ok: true, code: 0, stdout: "ok", stderr: "" };
        },
        probeDeskHealth: async () => ({
          ok: true,
          body: { ok: true, service: "glassbox-studio" },
        }),
        now: () => 1_700_000_000_000,
      },
      { auto: true },
    );
    expect(report.ok).toBe(true);
    expect(calls.some((c) => c.includes("pnpm install"))).toBe(true);
    expect(calls.some((c) => c.includes("restart"))).toBe(true);
  });
});
