import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { SqlExecutor } from "./types.js";
import { createSqlRecordsStore } from "./sql-records-store.js";

/** Node 22+ `node:sqlite` → SqlExecutor (Studio local = D1 stand-in). */
export function createNodeSqliteExecutor(dbPath: string): SqlExecutor {
  mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL;");
  return {
    async exec(sql) {
      db.exec(sql);
    },
    async run(sql, params = []) {
      const stmt = db.prepare(sql);
      const result = stmt.run(...(params as unknown[]));
      return { changes: Number(result.changes ?? 0) };
    },
    async all(sql, params = []) {
      const stmt = db.prepare(sql);
      return stmt.all(...(params as unknown[])) as never;
    },
    async get(sql, params = []) {
      const stmt = db.prepare(sql);
      return stmt.get(...(params as unknown[])) as never;
    },
  };
}

export function createLocalSqliteRecordsStore(dbPath: string) {
  return createSqlRecordsStore(createNodeSqliteExecutor(dbPath));
}

/** Seed demo tables if DB empty — mirrors ideal-stack drizzle migration intent. */
export async function ensureIdealRecordsSchema(
  sql: SqlExecutor,
): Promise<void> {
  await sql.exec(`
    CREATE TABLE IF NOT EXISTS form_submissions (
      id TEXT PRIMARY KEY NOT NULL,
      form_id TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS studio_messages (
      id TEXT PRIMARY KEY NOT NULL,
      conversation_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      direction TEXT NOT NULL,
      from_json TEXT NOT NULL,
      to_json TEXT,
      body_text TEXT NOT NULL,
      body_html TEXT,
      status TEXT NOT NULL,
      has_attachment INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      project_id TEXT,
      meta_json TEXT
    );
    CREATE INDEX IF NOT EXISTS studio_messages_conversation_idx
      ON studio_messages (conversation_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS studio_messages_channel_idx
      ON studio_messages (channel, created_at DESC);
    CREATE INDEX IF NOT EXISTS studio_messages_project_idx
      ON studio_messages (project_id, created_at DESC);
    CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      props_json TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      roles_json TEXT NOT NULL DEFAULT '[]',
      attrs_json TEXT NOT NULL DEFAULT '{}',
      consent_json TEXT NOT NULL DEFAULT '{}',
      source TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
    CREATE TABLE IF NOT EXISTS studio_notifications (
      id TEXT PRIMARY KEY NOT NULL,
      source TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      created_at INTEGER NOT NULL,
      read_at INTEGER,
      project_id TEXT,
      href_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS studio_notifications_created_idx
      ON studio_notifications (created_at DESC);
    CREATE INDEX IF NOT EXISTS studio_notifications_source_idx
      ON studio_notifications (source, created_at DESC);
    CREATE INDEX IF NOT EXISTS studio_notifications_unread_idx
      ON studio_notifications (read_at, created_at DESC);
  `);
  // Existing DBs may predate project_id / meta_json — add if missing.
  try {
    await sql.run(`ALTER TABLE studio_messages ADD COLUMN project_id TEXT`);
  } catch {
    /* column already exists */
  }
  try {
    await sql.run(`ALTER TABLE studio_messages ADD COLUMN meta_json TEXT`);
  } catch {
    /* column already exists */
  }
  try {
    await sql.run(`ALTER TABLE studio_messages ADD COLUMN body_html TEXT`);
  } catch {
    /* column already exists */
  }
  try {
    await sql.exec(`
    CREATE INDEX IF NOT EXISTS studio_messages_project_idx
      ON studio_messages (project_id, created_at DESC);
  `);
  } catch {
    /* ignore */
  }
}
