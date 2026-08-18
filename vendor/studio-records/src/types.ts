/**
 * RecordsStore — deep seam for browsing / querying project record stores.
 * Ideal: D1 (Cloudflare). Local Studio serve: SQLite file via node:sqlite.
 * Drizzle schemas live in the project; Studio browses the same DB.
 */

export type DataDestinationKind =
  | "d1"
  | "r2"
  | "form-inbox"
  | "mail-send"
  | "custom";

export type DataDestinationConfig = {
  id: string;
  kind: DataDestinationKind | string;
  label: string;
  binding?: string;
  /** Relative to project root — Studio local SQLite path for kind=d1. */
  localPath?: string;
  capabilities?: string[];
};

export type RecordsTableInfo = {
  name: string;
  rowCount: number;
};

export type RecordsColumn = {
  name: string;
  type: string;
  notNull: boolean;
  pk: boolean;
};

export type RecordsQueryResult = {
  columns: string[];
  rows: Record<string, unknown>[];
  total: number;
  limit: number;
  offset: number;
};

export type RecordsSortDir = "asc" | "desc";

export type RecordsQueryOpts = {
  table: string;
  limit?: number;
  offset?: number;
  /** Whitelisted column name (store validates against schema). */
  sortBy?: string;
  sortDir?: RecordsSortDir;
  /** Substring search across row values (server-side when SQL). */
  q?: string;
};

export type RecordsMutateResult = {
  row?: Record<string, unknown>;
  deleted?: number;
};

export type RecordsStore = {
  listTables: () => Promise<RecordsTableInfo[]>;
  describeTable: (table: string) => Promise<RecordsColumn[]>;
  query: (opts: RecordsQueryOpts) => Promise<RecordsQueryResult>;
  /** Insert a row; returns the inserted values (best-effort). */
  insertRow: (
    table: string,
    values: Record<string, unknown>,
  ) => Promise<RecordsMutateResult>;
  /** Update by primary key fields in `pk`. */
  updateRow: (
    table: string,
    pk: Record<string, unknown>,
    values: Record<string, unknown>,
  ) => Promise<RecordsMutateResult>;
  /** Delete by primary key fields in `pk`. */
  deleteRow: (
    table: string,
    pk: Record<string, unknown>,
  ) => Promise<RecordsMutateResult>;
};

/** Minimal SQL driver — shared with ledger / forms. */
export type SqlExecutor = {
  exec: (sql: string) => Promise<void>;
  run: (
    sql: string,
    params?: readonly unknown[],
  ) => Promise<{ changes: number }>;
  all: <T extends Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ) => Promise<T[]>;
  get: <T extends Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ) => Promise<T | undefined>;
};

export function isRecordsCapable(dest: DataDestinationConfig): boolean {
  if (dest.kind === "d1") return true;
  return (dest.capabilities ?? []).includes("records");
}

export function assertSafeIdent(name: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new Error(`unsafe identifier: ${name}`);
  }
  return name;
}
