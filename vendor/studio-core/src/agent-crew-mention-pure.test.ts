import { describe, expect, it } from "vitest";
import {
  extractCrewMentionHandles,
  planCrewMentionHandoffs,
} from "./agent-crew-mention-pure.js";

describe("extractCrewMentionHandles", () => {
  it("finds handles and ignores fences", () => {
    expect(
      extractCrewMentionHandles(
        "hey @reviewer see ```\n@ignored\n``` and `@also` then @writer",
      ),
    ).toEqual(["reviewer", "writer"]);
  });
});

describe("planCrewMentionHandoffs", () => {
  const profiles = [
    { id: "reviewer", title: "Reviewer", harnessId: "hermes" },
    { id: "writer", title: "Writer", harnessId: "cursor" },
  ];
  const roomMembers = [
    { chatId: "spawn_rev", label: "Reviewer" },
  ];

  it("prefers room send over spawn", () => {
    expect(
      planCrewMentionHandoffs({
        text: "@reviewer check this",
        profiles,
        roomMembers,
      }),
    ).toEqual([
      {
        catalogId: "studio.chat.send",
        chatId: "spawn_rev",
        text: "@reviewer check this",
      },
    ]);
  });

  it("spawns a profile not in the room", () => {
    expect(
      planCrewMentionHandoffs({
        text: "@writer draft the post",
        profiles,
        roomMembers,
      }),
    ).toEqual([
      {
        catalogId: "agents.spawn",
        label: "Writer",
        harnessId: "cursor",
        intent: "@writer draft the post",
      },
    ]);
  });

  it("ignores unknown and fenced handles", () => {
    expect(
      planCrewMentionHandoffs({
        text: "```\n@writer\n``` @nobody",
        profiles,
        roomMembers,
      }),
    ).toEqual([]);
  });
});
