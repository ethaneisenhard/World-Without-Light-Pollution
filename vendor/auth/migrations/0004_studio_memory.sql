-- Agent Memory graph (D1 twin of studio-ledger 0002_memory.sql)

CREATE TABLE IF NOT EXISTS memory_row (
  id TEXT NOT NULL PRIMARY KEY,
  scope TEXT NOT NULL CHECK (scope IN ('studio', 'project', 'session')),
  project_id TEXT,
  content TEXT NOT NULL,
  origin TEXT NOT NULL,
  status TEXT NOT NULL,
  source TEXT,
  why TEXT,
  score REAL NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_used_at INTEGER
);

CREATE INDEX IF NOT EXISTS memory_row_status_updated_idx
  ON memory_row (status, updated_at DESC);

CREATE INDEX IF NOT EXISTS memory_row_project_status_idx
  ON memory_row (project_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS memory_row_scope_status_idx
  ON memory_row (scope, status, updated_at DESC);
