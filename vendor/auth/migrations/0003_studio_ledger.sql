-- Studio ledger (chats + calendar events) — same schema as @glassbox-studio/studio-ledger
-- Applied on Studio Worker D1 alongside auth tables.

CREATE TABLE IF NOT EXISTS ledger_chat_session (
  id TEXT NOT NULL PRIMARY KEY,
  project_id TEXT,
  scope TEXT NOT NULL CHECK (scope IN ('studio', 'project')),
  title TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'agent',
  messages_json TEXT NOT NULL DEFAULT '[]',
  tab_open INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS ledger_chat_session_project_updated_idx
  ON ledger_chat_session (project_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS ledger_chat_session_scope_updated_idx
  ON ledger_chat_session (scope, updated_at DESC);

CREATE TABLE IF NOT EXISTS ledger_chat_workspace (
  workspace_key TEXT NOT NULL PRIMARY KEY,
  active_id TEXT
);

CREATE TABLE IF NOT EXISTS ledger_event (
  id TEXT NOT NULL PRIMARY KEY,
  kind TEXT NOT NULL,
  project_id TEXT,
  scope TEXT NOT NULL CHECK (scope IN ('studio', 'project')),
  session_id TEXT,
  title TEXT NOT NULL,
  starts_at INTEGER NOT NULL,
  ends_at INTEGER,
  meta_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS ledger_event_starts_idx
  ON ledger_event (starts_at DESC);

CREATE INDEX IF NOT EXISTS ledger_event_project_starts_idx
  ON ledger_event (project_id, starts_at DESC);

CREATE INDEX IF NOT EXISTS ledger_event_kind_starts_idx
  ON ledger_event (kind, starts_at DESC);
