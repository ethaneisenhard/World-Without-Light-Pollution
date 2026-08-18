import { describe, expect, it } from "vitest";
import {
  decideStaleProcessAction,
  extractStaleProcessHintsFromLogs,
  normalizeDevStartPolicy,
  pathsLikelySameProjectRoot,
} from "./runtime-stale-process-pure.js";

const NEXT_LOG = [
  "yarn run v1.22.22\n",
  "⨯ Another next dev server is already running.\n",
  "- Local:        http://localhost:3001\n",
  "- PID:          73595\n",
  "- Dir:          /Users/ethaneisenhard/www.beehiiv.com\n",
  "[exit] exited code=1 signal=null",
];

describe("runtime-stale-process-pure", () => {
  it("normalizes startPolicy defaults to stop-stale-and-retry + same-root", () => {
    expect(normalizeDevStartPolicy(undefined)).toEqual({
      onAlreadyRunning: "stop-stale-and-retry",
      match: "same-root",
      retry: 1,
      stop: { signal: "SIGTERM", graceMs: 500 },
    });
  });

  it("extracts Next already-running hints via registry detector", () => {
    const hints = extractStaleProcessHintsFromLogs(NEXT_LOG);
    expect(hints).toEqual([
      {
        detectorId: "next-already-running",
        pid: 73595,
        dir: "/Users/ethaneisenhard/www.beehiiv.com",
        localUrl: "http://localhost:3001",
      },
    ]);
  });

  it("same-root kill-and-retry when Dir matches project root", () => {
    const decision = decideStaleProcessAction({
      policy: normalizeDevStartPolicy(undefined),
      hints: extractStaleProcessHintsFromLogs(NEXT_LOG),
      projectRoot: "/Users/ethaneisenhard/www.beehiiv.com",
      staleRetryCount: 0,
    });
    expect(decision.action).toBe("kill-and-retry");
    if (decision.action === "kill-and-retry") {
      expect(decision.pids).toEqual([73595]);
      expect(decision.signal).toBe("SIGTERM");
    }
  });

  it("same-root falls back to attach when Dir mismatches", () => {
    const decision = decideStaleProcessAction({
      policy: { onAlreadyRunning: "stop-stale-and-retry", match: "same-root" },
      hints: extractStaleProcessHintsFromLogs(NEXT_LOG),
      projectRoot: "/other/project",
      staleRetryCount: 0,
    });
    expect(decision).toEqual({
      action: "attach",
      hints: extractStaleProcessHintsFromLogs(NEXT_LOG),
    });
  });

  it("respects onAlreadyRunning=fail and attach", () => {
    expect(
      decideStaleProcessAction({
        policy: { onAlreadyRunning: "fail" },
        hints: extractStaleProcessHintsFromLogs(NEXT_LOG),
        projectRoot: "/Users/ethaneisenhard/www.beehiiv.com",
        staleRetryCount: 0,
      }).action,
    ).toBe("fail");
    expect(
      decideStaleProcessAction({
        policy: { onAlreadyRunning: "attach" },
        hints: extractStaleProcessHintsFromLogs(NEXT_LOG),
        projectRoot: "/Users/ethaneisenhard/www.beehiiv.com",
        staleRetryCount: 0,
      }).action,
    ).toBe("attach");
  });

  it("pathsLikelySameProjectRoot ignores trailing slash case", () => {
    expect(
      pathsLikelySameProjectRoot(
        "/Users/Me/Proj/",
        "/users/me/proj",
      ),
    ).toBe(true);
  });
});
