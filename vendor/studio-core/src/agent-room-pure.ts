/**
 * Agent room (project awareness bus).
 * Chats join a project-scoped room; soft path claims; overlap for turn prepare.
 * Optional Presence plane for spawn/send/observe.
 */

export type AgentRoomMemberRole = "chat" | "spawned";

export type AgentRoomMember = {
  /** Chat / session id (stable for the conversation). */
  chatId: string;
  projectId: string;
  harnessId: string;
  /** Short label for glass-box (optional). */
  label: string | null;
  /** Operator-facing intent snippet (optional). */
  intent: string | null;
  lastSeenAt: number;
  role: AgentRoomMemberRole;
  /** Parent chat when role=spawned. */
  parentChatId: string | null;
};

export type AgentRoomPathClaim = {
  path: string;
  chatId: string;
  claimedAt: number;
  /** Soft claim expiry; stale claims ignored. */
  until: number;
};

export type AgentRoomState = {
  projectId: string;
  members: readonly AgentRoomMember[];
  claims: readonly AgentRoomPathClaim[];
};

export type AgentRoomOverlap = {
  path: string;
  chatIds: readonly string[];
};

export type AgentRoomEvent =
  | { type: "join"; member: AgentRoomMember }
  | { type: "heartbeat"; chatId: string; at: number }
  | { type: "leave"; chatId: string }
  | { type: "claim"; claims: readonly AgentRoomPathClaim[] }
  | { type: "prune"; at: number; staleMs: number };

const DEFAULT_STALE_MS = 5 * 60_000;
const DEFAULT_CLAIM_TTL_MS = 10 * 60_000;

export function emptyAgentRoom(projectId: string): AgentRoomState {
  return { projectId, members: [], claims: [] };
}

export function normalizeClaimPath(path: string): string {
  return path.trim().replace(/\\/g, "/").replace(/^\.\//, "");
}

/** Upsert member (join or refresh). */
export function joinAgentRoom(
  room: AgentRoomState,
  member: Omit<AgentRoomMember, "lastSeenAt" | "role" | "parentChatId"> & {
    lastSeenAt?: number;
    role?: AgentRoomMemberRole;
    parentChatId?: string | null;
  },
  now = Date.now(),
): AgentRoomState {
  const next: AgentRoomMember = {
    chatId: member.chatId.trim(),
    projectId: room.projectId,
    harnessId: member.harnessId.trim() || "unknown",
    label: member.label?.trim() || null,
    intent: member.intent?.trim() || null,
    lastSeenAt: member.lastSeenAt ?? now,
    role: member.role ?? "chat",
    parentChatId: member.parentChatId?.trim() || null,
  };
  if (!next.chatId) return room;
  const others = room.members.filter((m) => m.chatId !== next.chatId);
  return { ...room, members: [...others, next] };
}

export function createAgentRoomSpawnId(now = Date.now()): string {
  return `spawn_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Spawn a child agent onto the same project room (parent must exist or is joined). */
export function spawnAgentRoomAgent(
  room: AgentRoomState,
  input: {
    parentChatId: string;
    childChatId?: string;
    harnessId?: string;
    label?: string | null;
    intent?: string | null;
    now?: number;
  },
): { room: AgentRoomState; child: AgentRoomMember } {
  const now = input.now ?? Date.now();
  const parentChatId = input.parentChatId.trim();
  let next = room;
  if (parentChatId && !room.members.some((m) => m.chatId === parentChatId)) {
    next = joinAgentRoom(
      next,
      {
        chatId: parentChatId,
        projectId: room.projectId,
        harnessId: input.harnessId ?? "unknown",
        label: null,
        intent: null,
        role: "chat",
        parentChatId: null,
        lastSeenAt: now,
      },
      now,
    );
  }
  const child: AgentRoomMember = {
    chatId: (input.childChatId?.trim() || createAgentRoomSpawnId(now)).trim(),
    projectId: room.projectId,
    harnessId: (input.harnessId ?? "agent-room").trim() || "agent-room",
    label: input.label?.trim() || null,
    intent: input.intent?.trim() || null,
    lastSeenAt: now,
    role: "spawned",
    parentChatId: parentChatId || null,
  };
  next = joinAgentRoom(next, child, now);
  return { room: next, child };
}

export function heartbeatAgentRoom(
  room: AgentRoomState,
  chatId: string,
  now = Date.now(),
  patch?: { intent?: string | null; harnessId?: string; label?: string | null },
): AgentRoomState {
  const id = chatId.trim();
  if (!id) return room;
  const existing = room.members.find((m) => m.chatId === id);
  if (!existing) {
    return joinAgentRoom(
      room,
      {
        chatId: id,
        projectId: room.projectId,
        harnessId: patch?.harnessId ?? "unknown",
        label: patch?.label ?? null,
        intent: patch?.intent ?? null,
        lastSeenAt: now,
      },
      now,
    );
  }
  return {
    ...room,
    members: room.members.map((m) =>
      m.chatId === id
        ? {
            ...m,
            lastSeenAt: now,
            harnessId: patch?.harnessId?.trim() || m.harnessId,
            label:
              patch?.label !== undefined
                ? patch.label?.trim() || null
                : m.label,
            intent:
              patch?.intent !== undefined
                ? patch.intent?.trim() || null
                : m.intent,
          }
        : m,
    ),
  };
}

export function leaveAgentRoom(
  room: AgentRoomState,
  chatId: string,
): AgentRoomState {
  const id = chatId.trim();
  if (!id) return room;
  return {
    ...room,
    members: room.members.filter((m) => m.chatId !== id),
    claims: room.claims.filter((c) => c.chatId !== id),
  };
}

/** Soft-claim paths for a chat (replaces that chat’s prior claims). */
export function claimAgentRoomPaths(
  room: AgentRoomState,
  input: {
    chatId: string;
    paths: readonly string[];
    now?: number;
    ttlMs?: number;
  },
): AgentRoomState {
  const chatId = input.chatId.trim();
  if (!chatId) return room;
  const now = input.now ?? Date.now();
  const ttl = input.ttlMs ?? DEFAULT_CLAIM_TTL_MS;
  const until = now + ttl;
  const nextClaims = input.paths
    .map(normalizeClaimPath)
    .filter(Boolean)
    .map((path) => ({ path, chatId, claimedAt: now, until }));
  const others = room.claims.filter((c) => c.chatId !== chatId);
  return { ...room, claims: [...others, ...nextClaims] };
}

/** Drop stale members + expired claims. */
export function pruneAgentRoom(
  room: AgentRoomState,
  now = Date.now(),
  staleMs = DEFAULT_STALE_MS,
): AgentRoomState {
  const cutoff = now - staleMs;
  const members = room.members.filter((m) => m.lastSeenAt >= cutoff);
  const liveIds = new Set(members.map((m) => m.chatId));
  const claims = room.claims.filter(
    (c) => c.until > now && liveIds.has(c.chatId),
  );
  return { ...room, members, claims };
}

/** Paths claimed by 2+ distinct live chats. */
export function findAgentRoomOverlaps(
  room: AgentRoomState,
  now = Date.now(),
): AgentRoomOverlap[] {
  const byPath = new Map<string, Set<string>>();
  for (const c of room.claims) {
    if (c.until <= now) continue;
    let set = byPath.get(c.path);
    if (!set) {
      set = new Set();
      byPath.set(c.path, set);
    }
    set.add(c.chatId);
  }
  const out: AgentRoomOverlap[] = [];
  for (const [path, ids] of byPath) {
    if (ids.size >= 2) out.push({ path, chatIds: [...ids].sort() });
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

/** Other members in the room (exclude self). */
export function listAgentRoomSiblings(
  room: AgentRoomState,
  selfChatId: string,
): AgentRoomMember[] {
  const self = selfChatId.trim();
  return room.members
    .filter((m) => m.chatId !== self)
    .slice()
    .sort((a, b) => b.lastSeenAt - a.lastSeenAt);
}

/**
 * Format for turn prepare (dynamic inject — changes every turn; do not freeze).
 */
export function formatAgentRoomBundleSlice(input: {
  room: AgentRoomState;
  selfChatId: string;
  now?: number;
}): string {
  const now = input.now ?? Date.now();
  const siblings = listAgentRoomSiblings(input.room, input.selfChatId);
  const overlaps = findAgentRoomOverlaps(input.room, now);
  if (!siblings.length && !overlaps.length) return "";

  const lines: string[] = [
    "## Live agents (Agent room)",
    "Other chats/agents active on this project. Coordinate; avoid colliding writes.",
  ];
  if (siblings.length) {
    lines.push("Siblings:");
    for (const s of siblings) {
      const label = s.label || s.chatId;
      const intent = s.intent ? ` — ${s.intent.slice(0, 80)}` : "";
      const role = s.role === "spawned" ? " spawned" : "";
      const parent = s.parentChatId ? ` parent=${s.parentChatId}` : "";
      lines.push(
        `- ${label} (harness=${s.harnessId}${role}${parent})${intent}`,
      );
    }
  }
  if (overlaps.length) {
    lines.push("Overlapping path claims:");
    for (const o of overlaps) {
      lines.push(`- ${o.path} ← ${o.chatIds.join(", ")}`);
    }
  }
  return lines.join("\n");
}
