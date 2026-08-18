/**
 * DurableRuntime run graph — vendor-neutral durable execution SoT.
 * Adapters (Inngest / Agent rooms / n8n / CF Workflows / fake) translate; Studio owns the graph.
 * ADR 0013 — DurableRuntime ≠ HarnessRuntime.
 */

export type DurableSubstrateId =
  | "fake"
  | "inngest"
  | "agent-room"
  | "n8n"
  | "cf-workflows";

export type DurableStepKind = "run" | "invoke" | "wait" | "emit";

export type DurableStepStatus =
  | "pending"
  | "running"
  | "done"
  | "error"
  | "waiting";

export type DurableRunStatus =
  | "pending"
  | "running"
  | "waiting"
  | "done"
  | "error"
  | "cancelled";

export type DurableTrigger =
  | { type: "manual" }
  | { type: "chat-background"; chatId?: string }
  | {
      type: "roadmap-ticket";
      cardId: string;
      templateId?: string;
      /** Bind run chrome to a Studio chat session (per-chat Workflow agent). */
      chatId?: string;
    }
  | { type: "cron"; expression: string }
  | { type: "webhook"; name: string }
  | { type: "event"; name: string };

export type DurableStep = {
  id: string;
  kind: DurableStepKind;
  label?: string;
  /** Catalog / MCP action when kind=run */
  action?: string;
  input?: Record<string, unknown>;
  /** Event name for wait / emit */
  event?: string;
  /** Nested substrate for invoke */
  invokeSubstrate?: DurableSubstrateId;
  status: DurableStepStatus;
  result?: unknown;
  error?: string;
};

export type DurableRunGraph = {
  version: 1;
  runId: string;
  projectId: string;
  substrate: DurableSubstrateId;
  trigger: DurableTrigger;
  intent: string;
  steps: DurableStep[];
  status: DurableRunStatus;
  createdAt: number;
  updatedAt: number;
};

export type DurableSignal = {
  event: string;
  data?: unknown;
};

export type DurableObserveEvent = {
  at: number;
  type: "started" | "step" | "waiting" | "signaled" | "done" | "error" | "cancelled";
  stepId?: string;
  message?: string;
  graph: DurableRunGraph;
};

const SUBSTRATES: readonly DurableSubstrateId[] = [
  "fake",
  "inngest",
  "agent-room",
  "n8n",
  "cf-workflows",
];

const STEP_KINDS: readonly DurableStepKind[] = [
  "run",
  "invoke",
  "wait",
  "emit",
];

export function isDurableSubstrateId(value: unknown): value is DurableSubstrateId {
  return typeof value === "string" && (SUBSTRATES as readonly string[]).includes(value);
}

export function canonicalizeDurableSubstrateId(
  id: DurableSubstrateId | string,
): DurableSubstrateId {
  if (isDurableSubstrateId(id)) return id;
  return "fake";
}

export function createDurableRunId(now = Date.now()): string {
  return `dr_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export type CreateDurableRunInput = {
  projectId: string;
  intent: string;
  steps: Array<
    Omit<DurableStep, "status" | "result" | "error"> & {
      status?: DurableStepStatus;
    }
  >;
  substrate?: DurableSubstrateId;
  trigger?: DurableTrigger;
  runId?: string;
  now?: number;
};

/** Build a pending run graph (pure). */
export function createDurableRunGraph(input: CreateDurableRunInput): DurableRunGraph {
  const now = input.now ?? Date.now();
  const projectId = input.projectId.trim() || "_studio";
  const intent = input.intent.trim() || "(no intent)";
  const steps: DurableStep[] = input.steps.map((s, i) => ({
    id: s.id?.trim() || `step-${i + 1}`,
    kind: s.kind,
    label: s.label,
    action: s.action,
    input: s.input,
    event: s.event,
    invokeSubstrate: s.invokeSubstrate,
    status: s.status ?? "pending",
  }));
  return {
    version: 1,
    runId: input.runId?.trim() || createDurableRunId(now),
    projectId,
    substrate: canonicalizeDurableSubstrateId(input.substrate ?? "fake"),
    trigger: input.trigger ?? { type: "manual" },
    intent,
    steps,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
}

export type DurableValidation =
  | { ok: true; graph: DurableRunGraph }
  | { ok: false; error: string };

export function validateDurableRunGraph(raw: unknown): DurableValidation {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "graph must be an object" };
  }
  const g = raw as Record<string, unknown>;
  if (g.version !== 1) return { ok: false, error: "version must be 1" };
  if (typeof g.runId !== "string" || !g.runId.trim()) {
    return { ok: false, error: "runId required" };
  }
  if (typeof g.projectId !== "string" || !g.projectId.trim()) {
    return { ok: false, error: "projectId required" };
  }
  if (!isDurableSubstrateId(g.substrate)) {
    return { ok: false, error: "invalid substrate" };
  }
  if (typeof g.intent !== "string") {
    return { ok: false, error: "intent required" };
  }
  if (!Array.isArray(g.steps) || g.steps.length === 0) {
    return { ok: false, error: "steps must be a non-empty array" };
  }
  for (const step of g.steps) {
    if (!step || typeof step !== "object") {
      return { ok: false, error: "invalid step" };
    }
    const s = step as Record<string, unknown>;
    if (typeof s.id !== "string" || !s.id.trim()) {
      return { ok: false, error: "step.id required" };
    }
    if (typeof s.kind !== "string" || !(STEP_KINDS as readonly string[]).includes(s.kind)) {
      return { ok: false, error: `invalid step.kind on ${s.id}` };
    }
    if (s.kind === "wait" && (typeof s.event !== "string" || !s.event.trim())) {
      return { ok: false, error: `wait step ${s.id} requires event` };
    }
  }
  return { ok: true, graph: raw as DurableRunGraph };
}

/** First step that is not done (resume / crash recovery point). */
export function durableResumeStepIndex(graph: DurableRunGraph): number {
  return graph.steps.findIndex((s) => s.status !== "done");
}

export function durableResumeStep(graph: DurableRunGraph): DurableStep | null {
  const i = durableResumeStepIndex(graph);
  return i < 0 ? null : graph.steps[i]!;
}

export function markDurableRunRunning(
  graph: DurableRunGraph,
  now: number,
): DurableRunGraph {
  return { ...graph, status: "running", updatedAt: now };
}

export function markDurableStepRunning(
  graph: DurableRunGraph,
  stepId: string,
  now: number,
): DurableRunGraph {
  return {
    ...graph,
    status: "running",
    updatedAt: now,
    steps: graph.steps.map((s) =>
      s.id === stepId ? { ...s, status: "running", error: undefined } : s,
    ),
  };
}

export function markDurableStepDone(
  graph: DurableRunGraph,
  stepId: string,
  result: unknown,
  now: number,
): DurableRunGraph {
  const steps = graph.steps.map((s) =>
    s.id === stepId
      ? { ...s, status: "done" as const, result, error: undefined }
      : s,
  );
  const allDone = steps.every((s) => s.status === "done");
  return {
    ...graph,
    steps,
    status: allDone ? "done" : "running",
    updatedAt: now,
  };
}

export function markDurableStepWaiting(
  graph: DurableRunGraph,
  stepId: string,
  now: number,
): DurableRunGraph {
  return {
    ...graph,
    status: "waiting",
    updatedAt: now,
    steps: graph.steps.map((s) =>
      s.id === stepId ? { ...s, status: "waiting", error: undefined } : s,
    ),
  };
}

export function markDurableStepError(
  graph: DurableRunGraph,
  stepId: string,
  error: string,
  now: number,
): DurableRunGraph {
  return {
    ...graph,
    status: "error",
    updatedAt: now,
    steps: graph.steps.map((s) =>
      s.id === stepId ? { ...s, status: "error", error } : s,
    ),
  };
}

export function markDurableRunCancelled(
  graph: DurableRunGraph,
  now: number,
): DurableRunGraph {
  return { ...graph, status: "cancelled", updatedAt: now };
}

/**
 * Apply a human/system signal to a waiting wait-step.
 * Pure: only succeeds when graph is waiting on a matching event.
 */
export function applyDurableSignal(
  graph: DurableRunGraph,
  signal: DurableSignal,
  now: number,
): DurableValidation {
  if (graph.status === "cancelled") {
    return { ok: false, error: "run cancelled" };
  }
  if (graph.status === "done") {
    return { ok: false, error: "run already done" };
  }
  const waiting = graph.steps.find(
    (s) => s.status === "waiting" && s.kind === "wait",
  );
  if (!waiting) {
    return { ok: false, error: "no waiting step" };
  }
  if (waiting.event !== signal.event) {
    return {
      ok: false,
      error: `event mismatch: expected ${waiting.event}, got ${signal.event}`,
    };
  }
  return {
    ok: true,
    graph: markDurableStepDone(graph, waiting.id, signal.data ?? { ok: true }, now),
  };
}

/**
 * Advance one step for the fake substrate (and unit tests).
 * - run / emit / invoke → immediately done with stub result (caller may override via executor)
 * - wait → marks waiting and stops
 * Completed steps are skipped (memoized resume).
 */
export function advanceDurableRunOnce(
  graph: DurableRunGraph,
  now: number,
  executor?: (step: DurableStep) => { ok: true; result: unknown } | { ok: false; error: string },
): DurableRunGraph {
  if (
    graph.status === "done" ||
    graph.status === "error" ||
    graph.status === "cancelled" ||
    graph.status === "waiting"
  ) {
    return graph;
  }
  const step = durableResumeStep(graph);
  if (!step) {
    return { ...graph, status: "done", updatedAt: now };
  }
  if (step.kind === "wait") {
    return markDurableStepWaiting(graph, step.id, now);
  }
  let running = markDurableStepRunning(graph, step.id, now);
  if (executor) {
    const out = executor(step);
    if (!out.ok) return markDurableStepError(running, step.id, out.error, now);
    return markDurableStepDone(running, step.id, out.result, now);
  }
  const stub =
    step.kind === "emit"
      ? { emitted: step.event ?? step.id }
      : step.kind === "invoke"
        ? { invoked: step.invokeSubstrate ?? "fake" }
        : { action: step.action ?? step.id, input: step.input ?? {} };
  return markDurableStepDone(running, step.id, stub, now);
}

/** Drain until waiting, terminal, or maxSteps (default = step count). */
export function advanceDurableRunUntilPause(
  graph: DurableRunGraph,
  now: number,
  opts?: {
    maxSteps?: number;
    executor?: (step: DurableStep) =>
      | { ok: true; result: unknown }
      | { ok: false; error: string };
  },
): DurableRunGraph {
  const max = opts?.maxSteps ?? graph.steps.length + 1;
  let g = graph.status === "pending" ? markDurableRunRunning(graph, now) : graph;
  for (let i = 0; i < max; i++) {
    if (
      g.status === "waiting" ||
      g.status === "done" ||
      g.status === "error" ||
      g.status === "cancelled"
    ) {
      return g;
    }
    const before = durableResumeStepIndex(g);
    g = advanceDurableRunOnce(g, now + i, opts?.executor);
    const after = durableResumeStepIndex(g);
    if (before === after && g.status === "running") {
      // no progress
      return g;
    }
  }
  return g;
}
