/**
 * Ideal-stack Drizzle schema sketch — same tables Studio RecordsStore / FormInbox use.
 * Wire with drizzle-orm + D1 in the Worker; Studio local serve uses node:sqlite at
 * data-destinations/primary-d1.json → localPath (.data/primary.sqlite).
 *
 * This file is documentation + future codegen target; Studio does not import it.
 */
export const IDEAL_RECORDS_TABLES = [
  "form_submissions",
  "analytics_events",
  "users",
] as const;

export const formSubmissionsSql = `
CREATE TABLE IF NOT EXISTS form_submissions (
  id TEXT PRIMARY KEY NOT NULL,
  form_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
`;

export const analyticsEventsSql = `
CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  props_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
`;

export const usersSql = `
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
`;
