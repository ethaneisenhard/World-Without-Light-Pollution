import { describe, expect, it } from "vitest";
import { buildTurnInspect } from "./turn-inspect-pure.js";

describe("buildTurnInspect liveAgents siblings", () => {
  it("preserves sibling rows for spawn chrome", () => {
    const inspect = buildTurnInspect({
      bundle: {
        version: 1,
        projectId: "demo",
        harnessId: "agent-room",
        system: "sys",
        allowTools: null,
      },
      liveAgents: {
        siblingCount: 1,
        overlapCount: 0,
        spawnedCount: 1,
        siblings: [
          {
            chatId: "child-1",
            label: "Worker A",
            harnessId: "cursor",
            role: "spawned",
          },
        ],
      },
    });
    expect(inspect.liveAgents.siblings?.[0]).toMatchObject({
      chatId: "child-1",
      role: "spawned",
    });
  });
});
