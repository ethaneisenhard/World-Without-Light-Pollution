import { describe, expect, it } from "vitest";
import {
  addRoadmapCard,
  cardsByColumn,
  emptyRoadmapBoard,
  moveRoadmapCard,
  parseRoadmapBoardFile,
  serializeRoadmapBoardFile,
} from "./roadmap-pure.js";

describe("roadmap-pure", () => {
  it("parses board file and moves cards", () => {
    const board = parseRoadmapBoardFile(
      {
        version: 1,
        columns: [
          { id: "backlog", title: "Backlog", order: 0 },
          { id: "doing", title: "Doing", order: 1 },
        ],
        cards: [
          {
            id: "c1",
            title: "Ship memory",
            body: "",
            columnId: "backlog",
            order: 0,
          },
        ],
      },
      { scope: "project", projectId: "demo-blog" },
    );
    expect(board.cards[0]!.filePath).toContain("c1");
    const moved = moveRoadmapCard(board, "c1", "doing");
    expect(moved.cards[0]!.columnId).toBe("doing");
    expect(cardsByColumn(moved).doing?.[0]?.id).toBe("c1");
    const file = serializeRoadmapBoardFile(moved);
    expect(file.version).toBe(1);
    expect(file.cards[0]!.columnId).toBe("doing");
  });

  it("parses and serializes workflowTemplateId", () => {
    const board = parseRoadmapBoardFile(
      {
        version: 1,
        columns: [{ id: "ready", title: "Ready", order: 0 }],
        cards: [
          {
            id: "c_wf",
            title: "Workflow dogfood",
            body: "stub",
            columnId: "ready",
            order: 0,
            workflowTemplateId: "ship-with-approve",
          },
        ],
      },
      { scope: "project", projectId: "demo-blog" },
    );
    expect(board.cards[0]!.workflowTemplateId).toBe("ship-with-approve");
    const file = serializeRoadmapBoardFile(board);
    expect(file.cards[0]!.workflowTemplateId).toBe("ship-with-approve");
  });

  it("empty board has default columns", () => {
    const b = emptyRoadmapBoard("studio", null);
    expect(b.columns.length).toBeGreaterThanOrEqual(3);
  });

  it("adds a card to a column", () => {
    const board = emptyRoadmapBoard("studio", null);
    const next = addRoadmapCard(board, {
      title: "Portfolio link",
      columnId: "ready",
      projectId: "demo-blog",
      now: 1,
    });
    expect(next.cards).toHaveLength(1);
    expect(next.cards[0]!.columnId).toBe("ready");
    expect(next.cards[0]!.projectId).toBe("demo-blog");
    expect(next.cards[0]!.filePath).toMatch(/^cards\//);
  });

  function boardWithCards() {
    return parseRoadmapBoardFile(
      {
        version: 1,
        columns: [
          { id: "backlog", title: "Backlog", order: 0 },
          { id: "doing", title: "Doing", order: 1 },
        ],
        cards: [
          {
            id: "a",
            title: "A",
            body: "",
            columnId: "backlog",
            order: 0,
          },
          {
            id: "b",
            title: "B",
            body: "",
            columnId: "backlog",
            order: 1,
          },
          {
            id: "c",
            title: "C",
            body: "",
            columnId: "doing",
            order: 0,
          },
        ],
      },
      { scope: "project", projectId: "demo-blog" },
    );
  }

  it("inserts at toIndex when moving cross-column", () => {
    const board = boardWithCards();
    const moved = moveRoadmapCard(board, "a", "doing", 0);
    const doing = cardsByColumn(moved).doing!.map((x) => x.id);
    expect(doing).toEqual(["a", "c"]);
    expect(moved.cards.find((x) => x.id === "a")!.order).toBe(0);
    expect(moved.cards.find((x) => x.id === "c")!.order).toBe(1);
  });

  it("prepends to top when toIndex omitted", () => {
    const board = boardWithCards();
    const moved = moveRoadmapCard(board, "a", "doing");
    const doing = cardsByColumn(moved).doing!.map((x) => x.id);
    expect(doing).toEqual(["a", "c"]);
    expect(moved.cards.find((x) => x.id === "a")!.order).toBe(0);
  });

  it("reorders within the same column", () => {
    const board = boardWithCards();
    const moved = moveRoadmapCard(board, "b", "backlog", 0);
    const backlog = cardsByColumn(moved).backlog!.map((x) => x.id);
    expect(backlog).toEqual(["b", "a"]);
  });

  it("no-ops on invalid column", () => {
    const board = boardWithCards();
    const moved = moveRoadmapCard(board, "a", "nope", 0);
    expect(moved).toBe(board);
  });
});
