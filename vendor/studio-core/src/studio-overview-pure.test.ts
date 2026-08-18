import { describe, expect, it } from "vitest";
import {
  buildOverviewActivity,
  buildStudioOverview,
  healthChipLabel,
} from "./studio-overview-pure.js";

describe("studio-overview-pure", () => {
  it("builds sorted activity feed", () => {
    const rows = buildOverviewActivity(
      [{ id: "e1", title: "Ship", projectId: "p1", startsAt: 200 }],
      [{ id: "c1", title: "Ask", projectId: null, updatedAt: 300 }],
      0,
      10,
    );
    expect(rows[0]?.id).toBe("c1");
    expect(rows[1]?.kind).toBe("event");
  });

  it("projects overview model", () => {
    const model = buildStudioOverview({
      projects: [
        { id: "b", name: "Beta" },
        { id: "a", name: "Alpha" },
      ],
      events: [],
      chats: [],
      health: { apiOk: true, anthropicKeyPresent: false, mcpHttpOk: true },
    });
    expect(model.projects.map((p) => p.id)).toEqual(["a", "b"]);
    expect(healthChipLabel(model.health)).toContain("No API key");
  });
});
