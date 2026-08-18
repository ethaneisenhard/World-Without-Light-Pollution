import {
  extractPkValues,
  filterRowToSchema,
} from "./records-mutate-pure.js";
import {
  compareRecordsCell,
  normalizeRecordsPage,
  normalizeRecordsSearchQ,
  normalizeRecordsSortDir,
  rowMatchesRecordsSearch,
} from "./records-query-pure.js";
import type {
  RecordsColumn,
  RecordsQueryOpts,
  RecordsStore,
  RecordsTableInfo,
} from "./types.js";

function rowMatchesPk(
  row: Record<string, unknown>,
  pk: Record<string, unknown>,
): boolean {
  return Object.entries(pk).every(([k, v]) => row[k] === v);
}

/** In-memory fake for tests — no SQL. */
export function createMemoryRecordsStore(
  seed?: Record<string, Record<string, unknown>[]>,
): RecordsStore {
  const tables = new Map<string, Record<string, unknown>[]>();
  if (seed) {
    for (const [k, rows] of Object.entries(seed)) {
      tables.set(k, rows.map((r) => ({ ...r })));
    }
  }

  const store: RecordsStore = {
    async listTables() {
      const out: RecordsTableInfo[] = [];
      for (const [name, rows] of tables) {
        out.push({ name, rowCount: rows.length });
      }
      return out.sort((a, b) => a.name.localeCompare(b.name));
    },
    async describeTable(table) {
      const rows = tables.get(table) ?? [];
      const keys = new Set<string>();
      for (const r of rows) for (const k of Object.keys(r)) keys.add(k);
      const cols: RecordsColumn[] = [...keys].map((name) => ({
        name,
        type: "ANY",
        notNull: false,
        pk: name === "id",
      }));
      return cols;
    },
    async query(opts: RecordsQueryOpts) {
      let all = [...(tables.get(opts.table) ?? [])];
      const q = normalizeRecordsSearchQ(opts.q);
      if (q) {
        all = all.filter((row) => rowMatchesRecordsSearch(row, q));
      }
      const sortBy = opts.sortBy?.trim();
      const sortDir = normalizeRecordsSortDir(opts.sortDir) ?? "asc";
      if (sortBy) {
        all = [...all].sort((a, b) =>
          compareRecordsCell(a[sortBy], b[sortBy], sortDir),
        );
      }
      const { limit, offset } = normalizeRecordsPage(opts);
      const slice = all.slice(offset, offset + limit);
      const columns =
        slice.length > 0
          ? Object.keys(slice[0]!)
          : (await store.describeTable(opts.table)).map((c) => c.name);
      return {
        columns,
        rows: slice,
        total: all.length,
        limit,
        offset,
      };
    },
    async insertRow(table, values) {
      const schema = await store.describeTable(table);
      const allowed =
        schema.length > 0
          ? filterRowToSchema(schema, values)
          : { ...values };
      const list = tables.get(table) ?? [];
      list.push({ ...allowed });
      tables.set(table, list);
      return { row: allowed };
    },
    async updateRow(table, pk, values) {
      const schema = await store.describeTable(table);
      const pkVals = extractPkValues(schema, pk);
      const patch = filterRowToSchema(schema, values, { omitPk: true });
      const list = tables.get(table) ?? [];
      const idx = list.findIndex((r) => rowMatchesPk(r, pkVals));
      if (idx < 0) throw new Error("no rows updated");
      list[idx] = { ...list[idx], ...patch };
      return { row: list[idx] };
    },
    async deleteRow(table, pk) {
      const schema = await store.describeTable(table);
      const pkVals = extractPkValues(schema, pk);
      const list = tables.get(table) ?? [];
      const next = list.filter((r) => !rowMatchesPk(r, pkVals));
      const deleted = list.length - next.length;
      tables.set(table, next);
      return { deleted };
    },
  };
  return store;
}
