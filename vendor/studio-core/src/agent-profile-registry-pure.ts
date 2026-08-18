/**
 * In-memory AgentProfile list — no I/O.
 */

import {
  normalizeAgentProfile,
  parseAgentProfileSlug,
  type AgentProfile,
} from "./agent-profile-pure.js";

export type AgentProfileRegistry = {
  profiles: AgentProfile[];
};

export function emptyAgentProfileRegistry(): AgentProfileRegistry {
  return { profiles: [] };
}

export function parseAgentProfileRegistry(raw: unknown): AgentProfileRegistry {
  if (!raw || typeof raw !== "object") return emptyAgentProfileRegistry();
  const rec = raw as { profiles?: unknown };
  if (!Array.isArray(rec.profiles)) return emptyAgentProfileRegistry();
  let registry = emptyAgentProfileRegistry();
  for (const item of rec.profiles) {
    const next = upsertAgentProfile(registry, item as Record<string, unknown>);
    if (!("error" in next)) registry = next;
  }
  return registry;
}

export function listAgentProfiles(
  registry: AgentProfileRegistry,
): AgentProfile[] {
  return [...registry.profiles].sort((a, b) => a.id.localeCompare(b.id));
}

export function getAgentProfile(
  registry: AgentProfileRegistry,
  id: string,
): AgentProfile | null {
  const key = id.trim().toLowerCase();
  return registry.profiles.find((p) => p.id === key) ?? null;
}

export function createAgentProfile(
  registry: AgentProfileRegistry,
  input: Parameters<typeof normalizeAgentProfile>[0],
): AgentProfileRegistry | { error: string } {
  const row = normalizeAgentProfile(input);
  if ("error" in row) return row;
  if (getAgentProfile(registry, row.id)) return { error: "exists" };
  return { profiles: [...registry.profiles, row] };
}

export function upsertAgentProfile(
  registry: AgentProfileRegistry,
  input: Parameters<typeof normalizeAgentProfile>[0],
): AgentProfileRegistry | { error: string } {
  const row = normalizeAgentProfile(input);
  if ("error" in row) return row;
  const others = registry.profiles.filter((p) => p.id !== row.id);
  return { profiles: [...others, row] };
}

export function configureAgentProfile(
  registry: AgentProfileRegistry,
  input: Parameters<typeof normalizeAgentProfile>[0],
): AgentProfileRegistry | { error: string } {
  const id = parseAgentProfileSlug(input.id);
  if (!id) return { error: "invalid-id" };
  const existing = getAgentProfile(registry, id);
  if (!existing) return { error: "not-found" };
  return upsertAgentProfile(registry, {
    id,
    title: input.title === undefined ? existing.title : input.title,
    description:
      input.description === undefined ? existing.description : input.description,
    harnessId:
      input.harnessId === undefined ? existing.harnessId : input.harnessId,
    modelId: input.modelId === undefined ? existing.modelId : input.modelId,
    petId: input.petId === undefined ? existing.petId : input.petId,
    peerRef: input.peerRef === undefined ? existing.peerRef : input.peerRef,
    avatar: input.avatar === undefined ? existing.avatar : input.avatar,
  });
}

export function removeAgentProfile(
  registry: AgentProfileRegistry,
  id: string,
): AgentProfileRegistry {
  const key = id.trim().toLowerCase();
  return { profiles: registry.profiles.filter((p) => p.id !== key) };
}
