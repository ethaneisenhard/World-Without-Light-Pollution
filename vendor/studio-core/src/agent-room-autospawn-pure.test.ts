import { describe, expect, it } from "vitest";
import { resolveAgentRoomAutospawn } from "./agent-room-autospawn-pure.js";

describe("resolveAgentRoomAutospawn", () => {
  it("multitask + rooms on → spawn", () => {
    expect(
      resolveAgentRoomAutospawn({
        mode: "multitask",
        multiAgent: "agent-room",
      }),
    ).toEqual({ spawn: true, reason: "multitask mode" });
  });

  it("autospawn config → spawn", () => {
    expect(
      resolveAgentRoomAutospawn({
        mode: "agent",
        multiAgent: "agent-room",
        autospawn: true,
      }),
    ).toEqual({ spawn: true, reason: "ai.autospawn" });
  });

  it("default agent → no spawn", () => {
    expect(
      resolveAgentRoomAutospawn({ mode: "agent", multiAgent: "agent-room" }),
    ).toEqual({ spawn: false, reason: "default single-agent think" });
  });

  it("clone utterance skips Multitask fan-out", () => {
    expect(
      resolveAgentRoomAutospawn({
        mode: "multitask",
        multiAgent: "agent-room",
        userText: "Clone the GitHub repo www.beehive.com into the workspace",
      }),
    ).toEqual({ spawn: false, reason: "clone job — single agent" });
    expect(
      resolveAgentRoomAutospawn({
        mode: "multitask",
        multiAgent: "agent-room",
        userText: "Please clone.",
      }),
    ).toEqual({ spawn: false, reason: "clone job — single agent" });
  });

  it("multiAgent off → never", () => {
    expect(
      resolveAgentRoomAutospawn({
        mode: "multitask",
        multiAgent: "off",
        autospawn: true,
      }),
    ).toEqual({ spawn: false, reason: "multiAgent off" });
  });
});
