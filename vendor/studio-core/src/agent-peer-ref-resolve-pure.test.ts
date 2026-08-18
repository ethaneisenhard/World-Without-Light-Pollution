import { describe, expect, it } from "vitest";
import { normalizeAgentProfile } from "./agent-profile-pure.js";
import { resolvePeerRefForTurn } from "./agent-peer-ref-resolve-pure.js";

function profile(input: Parameters<typeof normalizeAgentProfile>[0]) {
  const row = normalizeAgentProfile(input);
  if ("error" in row) throw new Error(row.error);
  return row;
}

describe("resolvePeerRefForTurn", () => {
  const profiles = [
    profile({
      id: "reviewer",
      title: "Reviewer",
      harnessId: "hermes",
      peerRef: { kind: "hermes-profile", name: "researcher" },
    }),
    profile({ id: "writer", title: "Writer", harnessId: "cursor" }),
  ];

  it("prefers an explicit facet for this harness", () => {
    expect(
      resolvePeerRefForTurn({
        harnessId: "hermes",
        profiles,
        explicit: { kind: "hermes-profile", name: "override" },
        profileId: "reviewer",
      }),
    ).toEqual({ kind: "hermes-profile", name: "override" });
  });

  it("uses the profile facet when the room label matches", () => {
    expect(
      resolvePeerRefForTurn({
        harnessId: "hermes",
        profiles,
        labels: ["Reviewer"],
      }),
    ).toEqual({ kind: "hermes-profile", name: "researcher" });
  });

  it("defaults a facet from the profile id when harness has a registry row", () => {
    const bare = profile({ id: "scout", harnessId: "hermes" });
    expect(
      resolvePeerRefForTurn({
        harnessId: "hermes",
        profiles: [bare],
        profileId: "scout",
      }),
    ).toEqual({ kind: "hermes-profile", name: "scout" });
  });

  it("stays null for harnesses with no facet row", () => {
    expect(
      resolvePeerRefForTurn({
        harnessId: "cursor",
        profiles,
        profileId: "writer",
      }),
    ).toBeNull();
  });
});
