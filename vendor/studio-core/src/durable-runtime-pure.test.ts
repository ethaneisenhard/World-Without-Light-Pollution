import { describe, expect, it } from "vitest";
import {
  advanceDurableRunUntilPause,
  applyDurableSignal,
  createDurableRunGraph,
  durableResumeStep,
  validateDurableRunGraph,
} from "./durable-runtime-pure.js";

describe("durable-runtime-pure", () => {
  it("creates a pending graph with steps", () => {
    const g = createDurableRunGraph({
      projectId: "demo-blog",
      intent: "ship notes",
      now: 1_000,
      steps: [
        { id: "fetch", kind: "run", action: "notes.list" },
        { id: "approve", kind: "wait", event: "task/approved" },
        { id: "write", kind: "run", action: "notes.write" },
      ],
    });
    expect(g.status).toBe("pending");
    expect(g.steps).toHaveLength(3);
    expect(g.runId.startsWith("dr_")).toBe(true);
  });

  it("validates wait steps require event", () => {
    const bad = validateDurableRunGraph({
      version: 1,
      runId: "dr_x",
      projectId: "p",
      substrate: "fake",
      trigger: { type: "manual" },
      intent: "x",
      steps: [{ id: "w", kind: "wait", status: "pending" }],
      status: "pending",
      createdAt: 1,
      updatedAt: 1,
    });
    expect(bad.ok).toBe(false);
  });

  it("advances run/emit then pauses on wait (memoized resume)", () => {
    const g0 = createDurableRunGraph({
      projectId: "p",
      intent: "bg",
      now: 10,
      substrate: "fake",
      steps: [
        { id: "a", kind: "run", action: "tools.call" },
        { id: "b", kind: "wait", event: "task/approved" },
        { id: "c", kind: "run", action: "files.write" },
      ],
    });
    const paused = advanceDurableRunUntilPause(g0, 20);
    expect(paused.status).toBe("waiting");
    expect(paused.steps[0]!.status).toBe("done");
    expect(paused.steps[1]!.status).toBe("waiting");
    expect(paused.steps[2]!.status).toBe("pending");
    expect(durableResumeStep(paused)?.id).toBe("b");

    // Simulated crash: re-advance from saved graph — step a must stay done
    const again = advanceDurableRunUntilPause(paused, 30);
    expect(again.steps[0]!.status).toBe("done");
    expect(again.status).toBe("waiting");
  });

  it("applies Approve signal and finishes remaining steps", () => {
    const g0 = createDurableRunGraph({
      projectId: "p",
      intent: "approve path",
      now: 1,
      steps: [
        { id: "work", kind: "run", action: "x" },
        { id: "gate", kind: "wait", event: "task/approved" },
        { id: "finish", kind: "emit", event: "task/done" },
      ],
    });
    const waiting = advanceDurableRunUntilPause(g0, 2);
    const signaled = applyDurableSignal(
      waiting,
      { event: "task/approved", data: { ok: true } },
      3,
    );
    expect(signaled.ok).toBe(true);
    if (!signaled.ok) return;
    const done = advanceDurableRunUntilPause(signaled.graph, 4);
    expect(done.status).toBe("done");
    expect(done.steps.every((s) => s.status === "done")).toBe(true);
  });

  it("rejects mismatched signal event", () => {
    const g0 = createDurableRunGraph({
      projectId: "p",
      intent: "x",
      now: 1,
      steps: [
        { id: "gate", kind: "wait", event: "task/approved" },
      ],
    });
    const waiting = advanceDurableRunUntilPause(g0, 2);
    const bad = applyDurableSignal(waiting, { event: "other" }, 3);
    expect(bad.ok).toBe(false);
  });
});
