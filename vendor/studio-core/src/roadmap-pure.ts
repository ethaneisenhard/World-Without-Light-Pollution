/**
 * File-backed kanban / roadmap — markdown/YAML SoT, not DB-only cards.
 */

export type RoadmapScope = "studio" | "project";

export type RoadmapColumn = {
  id: string;
  title: string;
  /** Display order. */
  order: number;
};

export type RoadmapCard = {
  id: string;
  title: string;
  body: string;
  columnId: string;
  order: number;
  /** Portfolio → project drill-in. */
  projectId: string | null;
  /** Optional link into a project board card. */
  projectCardId: string | null;
  /** Relative path under board root (glass-box). */
  filePath: string;
  /** Workflow agent template id (registry); omit → ship-with-approve. */
  workflowTemplateId?: string;
};

export type RoadmapBoard = {
  scope: RoadmapScope;
  projectId: string | null;
  columns: RoadmapColumn[];
  cards: RoadmapCard[];
};

export type RoadmapBoardFile = {
  version: 1;
  columns: RoadmapColumn[];
  cards: Array<Omit<RoadmapCard, "filePath"> & { filePath?: string }>;
};

export function defaultRoadmapColumns(): RoadmapColumn[] {
  return [
    { id: "backlog", title: "Backlog", order: 0 },
    { id: "ready", title: "Ready", order: 1 },
    { id: "doing", title: "Doing", order: 2 },
    { id: "done", title: "Done", order: 3 },
  ];
}

export function createRoadmapCardId(now = Date.now()): string {
  return `card_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyRoadmapBoard(
  scope: RoadmapScope,
  projectId: string | null,
): RoadmapBoard {
  return {
    scope,
    projectId,
    columns: defaultRoadmapColumns(),
    cards: [],
  };
}

export function parseRoadmapBoardFile(
  raw: unknown,
  meta: { scope: RoadmapScope; projectId: string | null },
): RoadmapBoard {
  const empty = emptyRoadmapBoard(meta.scope, meta.projectId);
  if (!raw || typeof raw !== "object") return empty;
  const rec = raw as Record<string, unknown>;
  const columnsRaw = Array.isArray(rec.columns) ? rec.columns : [];
  const cardsRaw = Array.isArray(rec.cards) ? rec.cards : [];

  const columns: RoadmapColumn[] = columnsRaw
    .map((c, i) => {
      if (!c || typeof c !== "object") return null;
      const o = c as Record<string, unknown>;
      if (typeof o.id !== "string" || !o.id.trim()) return null;
      return {
        id: o.id.trim(),
        title: typeof o.title === "string" && o.title.trim() ? o.title.trim() : o.id,
        order: typeof o.order === "number" ? o.order : i,
      };
    })
    .filter((c): c is RoadmapColumn => c !== null);

  const cards: RoadmapCard[] = cardsRaw
    .map((c, i) => {
      if (!c || typeof c !== "object") return null;
      const o = c as Record<string, unknown>;
      if (typeof o.id !== "string" || !o.id.trim()) return null;
      if (typeof o.title !== "string") return null;
      const columnId =
        typeof o.columnId === "string" && o.columnId.trim()
          ? o.columnId.trim()
          : "backlog";
      const id = o.id.trim();
      const workflowTemplateId =
        typeof o.workflowTemplateId === "string" && o.workflowTemplateId.trim()
          ? o.workflowTemplateId.trim()
          : undefined;
      return {
        id,
        title: o.title.trim() || id,
        body: typeof o.body === "string" ? o.body : "",
        columnId,
        order: typeof o.order === "number" ? o.order : i,
        projectId: typeof o.projectId === "string" ? o.projectId : null,
        projectCardId:
          typeof o.projectCardId === "string" ? o.projectCardId : null,
        filePath:
          typeof o.filePath === "string" && o.filePath.trim()
            ? o.filePath.trim()
            : `cards/${id}.md`,
        ...(workflowTemplateId ? { workflowTemplateId } : {}),
      };
    })
    .filter((c): c is RoadmapCard => c !== null);

  return {
    scope: meta.scope,
    projectId: meta.projectId,
    columns: columns.length ? columns : defaultRoadmapColumns(),
    cards,
  };
}

export function serializeRoadmapBoardFile(board: RoadmapBoard): RoadmapBoardFile {
  return {
    version: 1,
    columns: [...board.columns].sort((a, b) => a.order - b.order),
    cards: [...board.cards]
      .sort((a, b) => a.order - b.order)
      .map(({ filePath, ...rest }) => ({ ...rest, filePath })),
  };
}

/**
 * Move card to column (optionally at `toIndex` within that column).
 * Same-column reorder supported. Returns new board (immutable).
 * When `toIndex` omitted → top of destination stack (index 0).
 */
export function moveRoadmapCard(
  board: RoadmapBoard,
  cardId: string,
  columnId: string,
  toIndex?: number,
): RoadmapBoard {
  const colOk = board.columns.some((c) => c.id === columnId);
  if (!colOk) return board;
  const moving = board.cards.find((c) => c.id === cardId);
  if (!moving) return board;

  const destOthers = board.cards
    .filter((c) => c.columnId === columnId && c.id !== cardId)
    .sort((a, b) => a.order - b.order);

  const clamped =
    typeof toIndex === "number" && Number.isFinite(toIndex)
      ? Math.max(0, Math.min(Math.floor(toIndex), destOthers.length))
      : 0;

  const destOrdered = [
    ...destOthers.slice(0, clamped),
    { ...moving, columnId, order: clamped },
    ...destOthers.slice(clamped),
  ].map((c, i) => ({ ...c, columnId, order: i }));

  const destById = new Map(destOrdered.map((c) => [c.id, c]));

  return {
    ...board,
    cards: board.cards.map((c) => {
      const updated = destById.get(c.id);
      return updated ?? c;
    }),
  };
}

/** Append a card to a column; returns new board (immutable). */
export function addRoadmapCard(
  board: RoadmapBoard,
  input: {
    title: string;
    body?: string;
    columnId?: string;
    projectId?: string | null;
    workflowTemplateId?: string;
    now?: number;
  },
): RoadmapBoard {
  const columnId = input.columnId?.trim() || "backlog";
  const colOk = board.columns.some((c) => c.id === columnId);
  if (!colOk) return board;
  const title = input.title.trim();
  if (!title) return board;
  const id = createRoadmapCardId(input.now);
  const inCol = board.cards.filter((c) => c.columnId === columnId);
  const workflowTemplateId = input.workflowTemplateId?.trim() || undefined;
  const card: RoadmapCard = {
    id,
    title,
    body: typeof input.body === "string" ? input.body : "",
    columnId,
    order: inCol.length,
    projectId:
      input.projectId !== undefined
        ? input.projectId
        : board.scope === "project"
          ? board.projectId
          : null,
    projectCardId: null,
    filePath: `cards/${id}.md`,
    ...(workflowTemplateId ? { workflowTemplateId } : {}),
  };
  return { ...board, cards: [...board.cards, card] };
}

export function cardsByColumn(
  board: RoadmapBoard,
): Record<string, RoadmapCard[]> {
  const map: Record<string, RoadmapCard[]> = {};
  for (const col of board.columns) map[col.id] = [];
  for (const card of [...board.cards].sort((a, b) => a.order - b.order)) {
    const list = map[card.columnId] ?? (map[card.columnId] = []);
    list.push(card);
  }
  return map;
}
