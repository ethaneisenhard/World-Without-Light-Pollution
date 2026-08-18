import { describe, expect, it } from "vitest";
import {
  createMultiAgentRunId,
  defaultAgentRoomSwarmGraph,
  setMultiAgentNodeStatus,
} from "./multi-agent-pure.js";

describe("multi-agent-pure", () => {
  it("builds agent room swarm skeleton", () => {
    const id = createMultiAgentRunId(1);
    const g = defaultAgentRoomSwarmGraph(id);
    expect(g.substrate).toBe("agent-room");
    expect(g.nodes.length).toBeGreaterThanOrEqual(3);
    const next = setMultiAgentNodeStatus(g, "planner", "running");
    expect(next.nodes.find((n) => n.id === "planner")?.status).toBe("running");
  });
});
