import { describe, expect, it } from "vitest";
import {
  normalizeVoicePlacement,
  resolveVoicePlacementEndpoints,
  voicePlacementFromHostAttachId,
} from "./voice-placement-pure.js";

describe("voice-placement-pure", () => {
  const local = {
    httpBase: "http://127.0.0.1:4410",
    wsUrl: "ws://127.0.0.1:4410/ws",
  };
  const hosted = {
    httpBase: "https://voice.desk.example",
    wsUrl: "wss://voice.desk.example/ws",
  };

  it("resolves local bases", () => {
    expect(
      resolveVoicePlacementEndpoints({
        placement: "local",
        localBases: local,
        hostedBases: hosted,
      }),
    ).toEqual({ ...local, ok: true });
  });

  it("fails hosted without bases", () => {
    const out = resolveVoicePlacementEndpoints({
      placement: "hosted",
      localBases: local,
      hostedBases: null,
    });
    expect(out.ok).toBe(false);
    expect(out.reason).toMatch(/Cloud Voice/);
  });

  it("maps Host attach → placement", () => {
    expect(voicePlacementFromHostAttachId("laptop")).toBe("local");
    expect(voicePlacementFromHostAttachId("desk")).toBe("hosted");
    expect(normalizeVoicePlacement("local")).toBe("local");
    expect(normalizeVoicePlacement("nope")).toBe("hosted");
  });
});
