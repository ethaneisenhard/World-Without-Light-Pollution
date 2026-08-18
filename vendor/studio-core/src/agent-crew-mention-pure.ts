/**
 * Composer @handle → Studio catalog handoff (not Hermes CLI).
 */

import { parseAgentProfileSlug } from "./agent-profile-pure.js";

export type CrewMentionProfile = {
  id: string;
  title: string;
  harnessId?: string;
};

export type CrewMentionRoomMember = {
  chatId: string;
  label: string | null;
};

export type CrewHandoffAction =
  | { catalogId: "studio.chat.send"; chatId: string; text: string }
  | {
      catalogId: "agents.spawn";
      label: string;
      harnessId: string | null;
      intent: string;
    };

const FENCE_RE = /```[\s\S]*?```/g;
const INLINE_CODE_RE = /`[^`]*`/g;
const HANDLE_RE = /(^|[\s([{])@([a-z0-9][a-z0-9_-]{0,63})\b/gi;

export function textOutsideCodeFences(text: string): string {
  return text.replace(FENCE_RE, " ").replace(INLINE_CODE_RE, " ");
}

export function extractCrewMentionHandles(text: string): string[] {
  const live = textOutsideCodeFences(text);
  const found: string[] = [];
  const seen = new Set<string>();
  HANDLE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = HANDLE_RE.exec(live))) {
    const id = parseAgentProfileSlug(m[2]);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    found.push(id);
  }
  return found;
}

function slugFromLabel(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const direct = parseAgentProfileSlug(raw);
  if (direct) return direct;
  return parseAgentProfileSlug(raw.trim().toLowerCase().replace(/\s+/g, "-"));
}

function matchHandle(
  handle: string,
  profiles: readonly CrewMentionProfile[],
  roomMembers: readonly CrewMentionRoomMember[],
):
  | { kind: "room"; member: CrewMentionRoomMember }
  | { kind: "profile"; profile: CrewMentionProfile }
  | { kind: "none" } {
  const room = roomMembers.find((m) => slugFromLabel(m.label) === handle);
  if (room) return { kind: "room", member: room };
  const profile = profiles.find(
    (p) => p.id === handle || slugFromLabel(p.title) === handle,
  );
  if (profile) return { kind: "profile", profile };
  return { kind: "none" };
}

export function planCrewMentionHandoffs(input: {
  text: string;
  profiles: readonly CrewMentionProfile[];
  roomMembers: readonly CrewMentionRoomMember[];
}): CrewHandoffAction[] {
  const text = input.text.trim();
  if (!text) return [];
  const handles = extractCrewMentionHandles(text);
  const actions: CrewHandoffAction[] = [];
  for (const handle of handles) {
    const hit = matchHandle(handle, input.profiles, input.roomMembers);
    switch (hit.kind) {
      case "room":
        actions.push({
          catalogId: "studio.chat.send",
          chatId: hit.member.chatId,
          text,
        });
        break;
      case "profile":
        actions.push({
          catalogId: "agents.spawn",
          label: hit.profile.title || hit.profile.id,
          harnessId: hit.profile.harnessId ?? null,
          intent: text,
        });
        break;
      case "none":
        break;
      default: {
        const _exhaustive: never = hit;
        return _exhaustive;
      }
    }
  }
  return actions;
}
