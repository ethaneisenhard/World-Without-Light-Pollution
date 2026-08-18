/**
 * AgentProfile peerRef kinds — which cli-peer adapter may read a facet.
 * New peer facet = register a row. Hosts never `if (kind === "hermes-profile")`.
 */

import {
  BUILTIN_HARNESS_IDS,
  normalizeHarnessIdAlias,
} from "./harness-policy-pure.js";

export type AgentPeerRefKind = string;

export type AgentPeerRef = {
  kind: AgentPeerRefKind;
  name: string;
};

export type AgentPeerRefRow = {
  /** Harness id that owns this facet (cli-peer adapter). */
  harnessId: string;
};

/**
 * Built-in facets. Extend via `registerAgentPeerRefKind` — do not branch in hosts.
 */
export const AGENT_PEER_REF_REGISTRY: Readonly<Record<string, AgentPeerRefRow>> =
  {
    "hermes-profile": { harnessId: BUILTIN_HARNESS_IDS.hermes },
  };

const extraRows = new Map<string, AgentPeerRefRow>();

/** Test / plugin seam — register without forking hosts. */
export function registerAgentPeerRefKind(
  kind: string,
  row: AgentPeerRefRow,
): void {
  const id = kind.trim();
  if (!id) return;
  extraRows.set(id, row);
}

export function clearAgentPeerRefKindOverrides(): void {
  extraRows.clear();
}

export function getAgentPeerRefRow(kind: string): AgentPeerRefRow | null {
  const id = kind.trim();
  if (!id) return null;
  return extraRows.get(id) ?? AGENT_PEER_REF_REGISTRY[id] ?? null;
}

export function listAgentPeerRefKinds(): string[] {
  return [...new Set([...Object.keys(AGENT_PEER_REF_REGISTRY), ...extraRows.keys()])].sort();
}

export function parseAgentPeerRef(raw: unknown): AgentPeerRef | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as { kind?: unknown; name?: unknown };
  const kind = typeof rec.kind === "string" ? rec.kind.trim() : "";
  const name = typeof rec.name === "string" ? rec.name.trim() : "";
  if (!name || !getAgentPeerRefRow(kind)) return null;
  return { kind, name };
}

/** Facet belongs to this harness → return it; else null (adapter ignores). */
export function peerRefForHarness(
  peerRef: AgentPeerRef | { kind: string; name: string } | null | undefined,
  harnessId: string,
): AgentPeerRef | null {
  if (!peerRef) return null;
  const parsed = parseAgentPeerRef(peerRef);
  if (!parsed) return null;
  const row = getAgentPeerRefRow(parsed.kind);
  if (!row) return null;
  const want = normalizeHarnessIdAlias(harnessId.trim());
  const owns = normalizeHarnessIdAlias(row.harnessId);
  if (want !== owns) return null;
  return parsed;
}

export function peerRefNameForHarness(
  peerRef: AgentPeerRef | { kind: string; name: string } | null | undefined,
  harnessId: string,
): string | null {
  return peerRefForHarness(peerRef, harnessId)?.name ?? null;
}

/** First registered facet kind owned by this harness (omni — not a vendor if). */
export function peerRefKindForHarness(harnessId: string): string | null {
  const want = normalizeHarnessIdAlias(harnessId.trim());
  if (!want) return null;
  for (const kind of listAgentPeerRefKinds()) {
    const row = getAgentPeerRefRow(kind);
    if (row && normalizeHarnessIdAlias(row.harnessId) === want) return kind;
  }
  return null;
}

export function defaultPeerRefForHarness(
  harnessId: string,
  name: string,
): AgentPeerRef | null {
  const kind = peerRefKindForHarness(harnessId);
  if (!kind) return null;
  return parseAgentPeerRef({ kind, name });
}
