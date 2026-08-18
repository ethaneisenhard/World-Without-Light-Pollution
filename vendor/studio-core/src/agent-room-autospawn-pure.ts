/**
 * When Studio should fan out Agent room workers (Cursor-like).
 * Coordination always uses the project room; this only decides spawn.
 */

import {
  parseMultiAgentSetting,
  type MultiAgentSetting,
} from "./agent-room-id-pure.js";
import { isSingleAgentGithubJob } from "./github-clone-target-pure.js";

export type AgentRoomAutospawnDecision = {
  spawn: boolean;
  reason: string;
};

/**
 * Autospawn when Multitask mode + multi-agent on, or explicit config flag.
 * Awareness (room join) is always on — this is fan-out only.
 */
export function resolveAgentRoomAutospawn(input: {
  /** Composer mode (agent | plan | ask | multitask | …). */
  mode?: string | null;
  multiAgent?: MultiAgentSetting | string | null;
  /** studioConfig.ai.autospawn — default false. */
  autospawn?: boolean | null;
  /** Last user text — clone jobs stay single-agent (no Agent-room stub). */
  userText?: string | null;
}): AgentRoomAutospawnDecision {
  const mode = (input.mode ?? "").trim().toLowerCase();
  const multi = parseMultiAgentSetting(input.multiAgent);
  if (multi === "off") {
    return { spawn: false, reason: "multiAgent off" };
  }
  if (isSingleAgentGithubJob(input.userText ?? "")) {
    return { spawn: false, reason: "clone job — single agent" };
  }
  if (mode === "multitask") {
    return { spawn: true, reason: "multitask mode" };
  }
  if (input.autospawn === true) {
    return { spawn: true, reason: "ai.autospawn" };
  }
  return { spawn: false, reason: "default single-agent think" };
}
