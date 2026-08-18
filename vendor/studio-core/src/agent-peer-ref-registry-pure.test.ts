import { afterEach, describe, expect, it } from "vitest";
import { BUILTIN_HARNESS_IDS } from "./harness-policy-pure.js";
import {
  clearAgentPeerRefKindOverrides,
  defaultPeerRefForHarness,
  getAgentPeerRefRow,
  listAgentPeerRefKinds,
  parseAgentPeerRef,
  peerRefForHarness,
  peerRefKindForHarness,
  peerRefNameForHarness,
  registerAgentPeerRefKind,
} from "./agent-peer-ref-registry-pure.js";

afterEach(() => {
  clearAgentPeerRefKindOverrides();
});

describe("AGENT_PEER_REF_REGISTRY", () => {
  it("maps hermes-profile to the hermes peer", () => {
    expect(getAgentPeerRefRow("hermes-profile")).toEqual({
      harnessId: BUILTIN_HARNESS_IDS.hermes,
    });
    expect(listAgentPeerRefKinds()).toContain("hermes-profile");
  });

  it("parse keeps registered kinds only", () => {
    expect(
      parseAgentPeerRef({ kind: "hermes-profile", name: "researcher" }),
    ).toEqual({ kind: "hermes-profile", name: "researcher" });
    expect(parseAgentPeerRef({ kind: "other", name: "x" })).toBeNull();
  });

  it("peerRefForHarness is harness-scoped", () => {
    const ref = { kind: "hermes-profile", name: "researcher" };
    expect(peerRefForHarness(ref, "hermes")).toEqual(ref);
    expect(peerRefForHarness(ref, "cursor")).toBeNull();
    expect(peerRefNameForHarness(ref, "hermes")).toBe("researcher");
  });

  it("defaults a facet from harness + name", () => {
    expect(peerRefKindForHarness("hermes")).toBe("hermes-profile");
    expect(defaultPeerRefForHarness("hermes", "scout")).toEqual({
      kind: "hermes-profile",
      name: "scout",
    });
    expect(defaultPeerRefForHarness("cursor", "scout")).toBeNull();
  });

  it("register adds a facet without a host branch", () => {
    registerAgentPeerRefKind("cursor-cloud", {
      harnessId: BUILTIN_HARNESS_IDS.cursor,
    });
    const ref = parseAgentPeerRef({ kind: "cursor-cloud", name: "ship" });
    expect(ref).toEqual({ kind: "cursor-cloud", name: "ship" });
    expect(peerRefForHarness(ref, "cursor")?.name).toBe("ship");
    expect(peerRefForHarness(ref, "hermes")).toBeNull();
  });
});
