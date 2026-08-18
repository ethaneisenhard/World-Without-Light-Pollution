/**
 * Agent room multi-agent graph — spawn / send / observe shapes.
 * Studio owns the graph + ledger timeline; Agent room (or stub) runs durable steps.
 */

export type MultiAgentNodeKind = "planner" | "worker" | "critic" | "custom";

export type MultiAgentNode = {
  id: string;
  kind: MultiAgentNodeKind;
  label: string;
  status: "pending" | "running" | "done" | "error";
};

export type MultiAgentEdge = {
  from: string;
  to: string;
  /** channel: send | observe */
  channel: "send" | "observe";
};

export type MultiAgentGraph = {
  version: 1;
  substrate: "agent-room";
  runId: string;
  nodes: MultiAgentNode[];
  edges: MultiAgentEdge[];
};

export function createMultiAgentRunId(now = Date.now()): string {
  return `mag_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Default planner → workers → critic swarm skeleton. */
export function defaultAgentRoomSwarmGraph(runId: string): MultiAgentGraph {
  return {
    version: 1,
    substrate: "agent-room",
    runId,
    nodes: [
      { id: "planner", kind: "planner", label: "Planner", status: "pending" },
      { id: "worker-a", kind: "worker", label: "Worker A", status: "pending" },
      { id: "worker-b", kind: "worker", label: "Worker B", status: "pending" },
      { id: "critic", kind: "critic", label: "Critic", status: "pending" },
    ],
    edges: [
      { from: "planner", to: "worker-a", channel: "send" },
      { from: "planner", to: "worker-b", channel: "send" },
      { from: "worker-a", to: "critic", channel: "observe" },
      { from: "worker-b", to: "critic", channel: "observe" },
    ],
  };
}

export function setMultiAgentNodeStatus(
  graph: MultiAgentGraph,
  nodeId: string,
  status: MultiAgentNode["status"],
): MultiAgentGraph {
  return {
    ...graph,
    nodes: graph.nodes.map((n) =>
      n.id === nodeId ? { ...n, status } : n,
    ),
  };
}
