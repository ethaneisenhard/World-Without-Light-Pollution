import { describe, expect, it } from "vitest";
import { parseAgentPeerRef } from "./agent-peer-ref-registry-pure.js";
import {
  normalizeAgentProfile,
  parseAgentProfileSlug,
} from "./agent-profile-pure.js";
import {
  configureAgentProfile,
  createAgentProfile,
  emptyAgentProfileRegistry,
  getAgentProfile,
  listAgentProfiles,
  parseAgentProfileRegistry,
  removeAgentProfile,
  upsertAgentProfile,
} from "./agent-profile-registry-pure.js";

describe("parseAgentProfileSlug", () => {
  it("accepts hermes-like slugs", () => {
    expect(parseAgentProfileSlug("Reviewer")).toBe("reviewer");
    expect(parseAgentProfileSlug("bad id")).toBeNull();
  });
});

describe("parseAgentPeerRef", () => {
  it("keeps registered peerRef kinds only", () => {
    expect(
      parseAgentPeerRef({ kind: "hermes-profile", name: "researcher" }),
    ).toEqual({ kind: "hermes-profile", name: "researcher" });
    expect(parseAgentPeerRef({ kind: "other", name: "x" })).toBeNull();
  });
});

describe("agent profile registry", () => {
  it("upserts, lists, removes", () => {
    let reg = emptyAgentProfileRegistry();
    const up = upsertAgentProfile(reg, {
      id: "reviewer",
      title: "Reviewer",
      harnessId: "anthropic",
    });
    if ("error" in up) throw new Error(up.error);
    reg = up;
    expect(getAgentProfile(reg, "Reviewer")?.harnessId).toBe("anthropic");
    expect(listAgentProfiles(reg).map((p) => p.id)).toEqual(["reviewer"]);
    reg = removeAgentProfile(reg, "reviewer");
    expect(getAgentProfile(reg, "reviewer")).toBeNull();
  });

  it("create fails when the slug exists", () => {
    let reg = emptyAgentProfileRegistry();
    const first = createAgentProfile(reg, { id: "reviewer" });
    if ("error" in first) throw new Error(first.error);
    reg = first;
    expect(createAgentProfile(reg, { id: "reviewer" })).toEqual({
      error: "exists",
    });
  });

  it("configure patches without wiping title", () => {
    let reg = emptyAgentProfileRegistry();
    const first = createAgentProfile(reg, {
      id: "reviewer",
      title: "Reviewer",
    });
    if ("error" in first) throw new Error(first.error);
    reg = first;
    const next = configureAgentProfile(reg, {
      id: "reviewer",
      harnessId: "hermes",
    });
    if ("error" in next) throw new Error(next.error);
    expect(getAgentProfile(next, "reviewer")).toMatchObject({
      title: "Reviewer",
      harnessId: "hermes",
    });
  });

  it("parses persisted json and skips bad rows", () => {
    const reg = parseAgentProfileRegistry({
      profiles: [{ id: "ok" }, { id: "Bad Id" }, { title: "no-id" }],
    });
    expect(listAgentProfiles(reg).map((p) => p.id)).toEqual(["ok"]);
  });

  it("rejects bad ids", () => {
    const bad = upsertAgentProfile(emptyAgentProfileRegistry(), { id: "Bad Id" });
    expect(bad).toEqual({ error: "invalid-id" });
  });
});

describe("normalizeAgentProfile", () => {
  it("defaults title and harness", () => {
    const row = normalizeAgentProfile({ id: "writer" });
    expect(row).toMatchObject({
      id: "writer",
      title: "writer",
      description: null,
      harnessId: "cursor",
      peerRef: null,
      avatar: { kind: "bot", shape: "circle", color: "orange" },
    });
  });
});
