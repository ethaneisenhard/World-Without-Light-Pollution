import { describe, expect, it } from "vitest";
import {
  panelKindsForAgentWrite,
  panelRefreshMatchesOpenBoard,
  roadmapBoardRefreshPath,
} from "./panel-agent-refresh-pure.js";

describe("panelKindsForAgentWrite", () => {
  it("maps roadmap board / cards paths", () => {
    expect(panelKindsForAgentWrite(".glassbox-studio/roadmap/board.json")).toEqual([
      "roadmap",
    ]);
    expect(
      panelKindsForAgentWrite(".glassbox-studio/roadmap/cards/preview.md"),
    ).toEqual(["roadmap"]);
    expect(panelKindsForAgentWrite("roadmap/board.json")).toEqual(["roadmap"]);
  });

  it("maps notes and memory trees", () => {
    expect(panelKindsForAgentWrite(".glassbox-studio/notes/Ideas/a.md")).toEqual([
      "notes",
    ]);
    expect(panelKindsForAgentWrite(".glassbox-studio/memory/foo.json")).toEqual([
      "memory",
    ]);
  });

  it("ignores unrelated writes", () => {
    expect(panelKindsForAgentWrite("src/index.ts")).toEqual([]);
    expect(panelKindsForAgentWrite("content/pages/home.md")).toEqual([]);
    expect(panelKindsForAgentWrite("../escape/roadmap/board.json")).toEqual([]);
  });
});

describe("roadmapBoardRefreshPath / panelRefreshMatchesOpenBoard", () => {
  it("builds logical board paths", () => {
    expect(roadmapBoardRefreshPath("studio")).toBe(
      ".glassbox-studio/roadmap/board.json",
    );
    expect(roadmapBoardRefreshPath("project", "demo-blog")).toBe(
      "demo-blog/.glassbox-studio/roadmap/board.json",
    );
  });

  it("matches open board scope", () => {
    expect(
      panelRefreshMatchesOpenBoard(
        { scope: "studio" },
        { scope: "studio", projectId: null },
      ),
    ).toBe(true);
    expect(
      panelRefreshMatchesOpenBoard(
        { scope: "project", projectId: "a" },
        { scope: "studio", projectId: null },
      ),
    ).toBe(false);
    expect(
      panelRefreshMatchesOpenBoard(
        { scope: "project", projectId: "a" },
        { scope: "project", projectId: "a" },
      ),
    ).toBe(true);
    expect(
      panelRefreshMatchesOpenBoard({}, { scope: "project", projectId: "a" }),
    ).toBe(true);
  });
});
