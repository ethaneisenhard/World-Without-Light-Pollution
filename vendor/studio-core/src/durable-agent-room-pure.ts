/**
 * Agent room durable swarm graph — Studio-owned stub (no vendor brain).
 */

import {
  createDurableRunGraph,
  type DurableRunGraph,
  type DurableStep,
} from "./durable-runtime-pure.js";
import {
  createMultiAgentRunId,
  defaultAgentRoomSwarmGraph,
  type MultiAgentGraph,
} from "./multi-agent-pure.js";

/** Map Agent room swarm skeleton → DurableRuntime steps (one run step per node). */
export function durableStepsFromAgentRoomSwarm(
  multi: MultiAgentGraph,
): Array<Omit<DurableStep, "status" | "result" | "error"> & { status?: DurableStep["status"] }> {
  return multi.nodes.map((n) => ({
    id: n.id,
    kind: "run" as const,
    label: n.label,
    action: `agent-room.node.${n.kind}`,
    input: { nodeId: n.id, kind: n.kind, channel: "swarm" },
  }));
}

export function createAgentRoomSwarmDurableGraph(input: {
  projectId: string;
  intent: string;
  runId?: string;
  now?: number;
  chatId?: string;
}): { durable: DurableRunGraph; multi: MultiAgentGraph } {
  const runId = input.runId?.trim() || createMultiAgentRunId(input.now);
  const multi = defaultAgentRoomSwarmGraph(runId);
  const durable = createDurableRunGraph({
    projectId: input.projectId,
    intent: input.intent,
    runId,
    now: input.now,
    substrate: "agent-room",
    trigger: input.chatId
      ? { type: "chat-background", chatId: input.chatId }
      : { type: "manual" },
    steps: durableStepsFromAgentRoomSwarm(multi),
  });
  return { durable, multi };
}
