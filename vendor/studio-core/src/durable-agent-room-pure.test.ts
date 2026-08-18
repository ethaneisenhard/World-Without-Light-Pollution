import { describe, expect, it } from "vitest";
import { resolveDurableSubstrateForIntent } from "./durable-runtime-registry-pure.js";
import {
  createAgentRoomSwarmDurableGraph,
  durableStepsFromAgentRoomSwarm,
} from "./durable-agent-room-pure.js";

describe("durable-agent-room-pure", () => {
  it("maps swarm nodes to durable steps", () => {
    const { multi } = createAgentRoomSwarmDurableGraph({
      projectId: "demo",
      intent: "ship",
    });
    const steps = durableStepsFromAgentRoomSwarm(multi);
    expect(steps.length).toBe(multi.nodes.length);
    expect(steps[0]?.action).toMatch(/^agent-room\.node\./);
  });

  it("builds durable graph with agent-room substrate", () => {
    const { durable } = createAgentRoomSwarmDurableGraph({
      projectId: "demo",
      intent: "ship",
    });
    expect(durable.substrate).toBe("agent-room");
  });

  it("routes swarm intent to agent-room fallback", () => {
    expect(resolveDurableSubstrateForIntent("swarm")).toBe("agent-room");
  });
});
