/**
 * Studio crew worker template — harness-agnostic. Optional peerRef facet.
 */

import {
  parseAgentPeerRef,
  type AgentPeerRef,
} from "./agent-peer-ref-registry-pure.js";
import {
  normalizeAgentAvatar,
  parseAgentDescription,
  type AgentAvatar,
} from "./agent-avatar-pure.js";

export const AGENT_PROFILE_SLUG_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/;

export type AgentProfile = {
  id: string;
  title: string;
  description: string | null;
  harnessId: string;
  modelId: string | null;
  petId: string | null;
  peerRef: AgentPeerRef | null;
  avatar: AgentAvatar;
};

export function parseAgentProfileSlug(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const id = raw.trim().toLowerCase();
  if (!AGENT_PROFILE_SLUG_RE.test(id)) return null;
  return id;
}

export function normalizeAgentProfile(input: {
  id?: unknown;
  title?: unknown;
  description?: unknown;
  harnessId?: unknown;
  modelId?: unknown;
  petId?: unknown;
  peerRef?: unknown;
  avatar?: unknown;
}): AgentProfile | { error: string } {
  const id = parseAgentProfileSlug(input.id);
  if (!id) return { error: "invalid-id" };
  const title =
    typeof input.title === "string" && input.title.trim()
      ? input.title.trim()
      : id;
  const harnessId =
    typeof input.harnessId === "string" && input.harnessId.trim()
      ? input.harnessId.trim()
      : "cursor";
  const modelId =
    typeof input.modelId === "string" && input.modelId.trim()
      ? input.modelId.trim()
      : null;
  const petId =
    typeof input.petId === "string" && input.petId.trim()
      ? input.petId.trim()
      : null;
  return {
    id,
    title,
    description: parseAgentDescription(input.description),
    harnessId,
    modelId,
    petId,
    peerRef: parseAgentPeerRef(input.peerRef),
    avatar: normalizeAgentAvatar(input.avatar),
  };
}
