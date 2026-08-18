import {
  extractPkValues,
  filterRowToSchema,
} from "./records-mutate-pure.js";
import {
  normalizeRecordsPage,
  normalizeRecordsSearchQ,
  normalizeRecordsSortDir,
} from "./records-query-pure.js";
import {
  assertSafeIdent,
  type RecordsColumn,
  type RecordsMutateResult,
  type RecordsQueryOpts,
  type RecordsQueryResult,
  type RecordsStore,
  type RecordsTableInfo,
  type SqlExecutor,
} from "./types.js";

function resolveSortColumn(
  schema: RecordsColumn[],
  sortBy: string | undefined,
): string | undefined {
  if (!sortBy) return undefined;
  const safe = assertSafeIdent(sortBy);
  return schema.some((c) => c.name === safe) ? safe : undefined;
}

/** RecordsStore over any SqlExecutor (Node SQLite or D1). */
export function createSqlRecordsStore(sql: SqlExecutor): RecordsStore {
  return {
    async listTables() {
      const rows = await sql.all<{ name: string }>(
        `SELECT name FROM sqlite_master
         WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
         ORDER BY name`,
      );
      const out: RecordsTableInfo[] = [];
      for (const row of rows) {
        const name = assertSafeIdent(row.name);
        const countRow = await sql.get<{ c: number }>(
          `SELECT COUNT(*) AS c FROM "${name}"`,
        );
        out.push({ name, rowCount: Number(countRow?.c ?? 0) });
      }
      return out;
    },

    async describeTable(table) {
      const name = assertSafeIdent(table);
      const cols = await sql.all<{
        name: string;
        type: string;
        notnull: number;
        pk: number;
      }>(`PRAGMA table_info("${name}")`);
      return cols.map(
        (c): RecordsColumn => ({
          name: c.name,
          type: c.type || "ANY",
          notNull: Boolean(c.notnull),
          pk: Boolean(c.pk),
        }),
      );
    },

    async query(opts: RecordsQueryOpts) {
      const name = assertSafeIdent(opts.table);
      const { limit, offset } = normalizeRecordsPage(opts);
      const schema = await this.describeTable(name);
      const q = normalizeRecordsSearchQ(opts.q);
      const sortDir = normalizeRecordsSortDir(opts.sortDir) ?? "asc";
      const sortCol = resolveSortColumn(schema, opts.sortBy);

      const whereParts: string[] = [];
      const params: unknown[] = [];
      if (q) {
        const like = `%${q.replace(/[%_]/g, "")}%`;
        const ors = schema.map((c) => {
          const col = assertSafeIdent(c.name);
          return `CAST("${col}" AS TEXT) LIKE ?`;
        });
        if (ors.length > 0) {
          whereParts.push(`(${ors.join(" OR ")})`);
          for (let i = 0; i < ors.length; i++) params.push(like);
        }
      }
      const whereSql =
        whereParts.length > 0 ? ` WHERE ${whereParts.join(" AND ")}` : "";
      const orderSql = sortCol
        ? ` ORDER BY "${sortCol}" ${sortDir === "desc" ? "DESC" : "ASC"}`
        : "";

      const countRow = await sql.get<{ c: number }>(
        `SELECT COUNT(*) AS c FROM "${name}"${whereSql}`,
        params,
      );
      const total = Number(countRow?.c ?? 0);
      const rows = await sql.all<Record<string, unknown>>(
        `SELECT * FROM "${name}"${whereSql}${orderSql} LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      );
      const columns =
        rows.length > 0
          ? Object.keys(rows[0]!)
          : schema.map((c) => c.name);
      const result: RecordsQueryResult = {
        columns,
        rows,
        total,
        limit,
        offset,
      };
      return result;
    },

    async insertRow(table, values) {
      const name = assertSafeIdent(table);
      const schema = await this.describeTable(name);
      const row = filterRowToSchema(schema, values);
      const cols = Object.keys(row);
      if (cols.length === 0) throw new Error("no columns to insert");
      const placeholders = cols.map(() => "?").join(", ");
      const colSql = cols.map((c) => `"${assertSafeIdent(c)}"`).join(", ");
      await sql.run(
        `INSERT INTO "${name}" (${colSql}) VALUES (${placeholders})`,
        cols.map((c) => row[c]),
      );
      const result: RecordsMutateResult = { row };
      return result;
    },

    async updateRow(table, pk, values) {
      const name = assertSafeIdent(table);
      const schema = await this.describeTable(name);
      const pkVals = extractPkValues(schema, pk);
      const row = filterRowToSchema(schema, values, { omitPk: true });
      const cols = Object.keys(row);
      if (cols.length === 0) throw new Error("no columns to update");
      const setSql = cols
        .map((c) => `"${assertSafeIdent(c)}" = ?`)
        .join(", ");
      const pkCols = Object.keys(pkVals);
      const whereSql = pkCols
        .map((c) => `"${assertSafeIdent(c)}" = ?`)
        .join(" AND ");
      const run = await sql.run(
        `UPDATE "${name}" SET ${setSql} WHERE ${whereSql}`,
        [...cols.map((c) => row[c]), ...pkCols.map((c) => pkVals[c])],
      );
      if (run.changes < 1) throw new Error("no rows updated");
      return { row: { ...pkVals, ...row } };
    },

    async deleteRow(table, pk) {
      const name = assertSafeIdent(table);
      const schema = await this.describeTable(name);
      const pkVals = extractPkValues(schema, pk);
      const pkCols = Object.keys(pkVals);
      const whereSql = pkCols
        .map((c) => `"${assertSafeIdent(c)}" = ?`)
        .join(" AND ");
      const run = await sql.run(
        `DELETE FROM "${name}" WHERE ${whereSql}`,
        pkCols.map((c) => pkVals[c]),
      );
      return { deleted: run.changes };
    },
  };
}
