/**
 * Bind a turn to a registered peer facet from crew profiles.
 * No harness vendor branches — lookup + defaultPeerRefForHarness.
 */

import {
  defaultPeerRefForHarness,
  parseAgentPeerRef,
  peerRefForHarness,
  type AgentPeerRef,
} from "./agent-peer-ref-registry-pure.js";
import { parseAgentProfileSlug, type AgentProfile } from "./agent-profile-pure.js";

function slugFromLabel(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const direct = parseAgentProfileSlug(raw);
  if (direct) return direct;
  return parseAgentProfileSlug(raw.trim().toLowerCase().replace(/\s+/g, "-"));
}

export function resolvePeerRefForTurn(input: {
  harnessId: string;
  profiles: readonly AgentProfile[];
  explicit?: unknown;
  profileId?: string | null;
  labels?: readonly (string | null | undefined)[];
}): AgentPeerRef | null {
  const harnessId = input.harnessId.trim();
  if (!harnessId) return null;

  const fromExplicit = peerRefForHarness(
    parseAgentPeerRef(input.explicit),
    harnessId,
  );
  if (fromExplicit) return fromExplicit;

  const slugs: string[] = [];
  const seen = new Set<string>();
  const push = (slug: string | null) => {
    if (!slug || seen.has(slug)) return;
    seen.add(slug);
    slugs.push(slug);
  };
  push(parseAgentProfileSlug(input.profileId));
  for (const label of input.labels ?? []) {
    push(slugFromLabel(label));
  }

  for (const slug of slugs) {
    const profile = input.profiles.find((p) => p.id === slug);
    if (!profile) continue;
    const bound =
      peerRefForHarness(profile.peerRef, harnessId) ??
      defaultPeerRefForHarness(harnessId, profile.id);
    if (bound) return bound;
  }
  return null;
}
