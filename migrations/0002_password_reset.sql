-- Password reset tokens (Starter + Studio D1)
-- Mirrors @glassbox-studio/auth migration 0006.

CREATE TABLE IF NOT EXISTS PasswordResetToken (
  id TEXT NOT NULL PRIMARY KEY,
  userId TEXT NOT NULL,
  tokenHash TEXT NOT NULL UNIQUE,
  expiresAt TEXT NOT NULL,
  usedAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS PasswordResetToken_userId_idx ON PasswordResetToken(userId);
