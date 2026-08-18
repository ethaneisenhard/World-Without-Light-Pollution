-- Existing D1 DBs created before rev column — no-op if already present
-- (Wrangler tracks this file; ALTER runs once.)
ALTER TABLE ledger_chat_workspace ADD COLUMN rev INTEGER NOT NULL DEFAULT 0;
