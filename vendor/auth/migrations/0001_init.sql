-- Glass Box Studio auth schema (D1 / SQLite)
-- Kent Passkey shape: https://github.com/kentcdodds/kentcdodds.com

CREATE TABLE IF NOT EXISTS User (
  id TEXT NOT NULL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('MEMBER', 'SUBSCRIBER')),
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Session (
  id TEXT NOT NULL PRIMARY KEY,
  userId TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS Session_userId_idx ON Session(userId);

CREATE TABLE IF NOT EXISTS OAuthAccount (
  id TEXT NOT NULL PRIMARY KEY,
  provider TEXT NOT NULL,
  providerAccountId TEXT NOT NULL,
  userId TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(provider, providerAccountId),
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Passkey (
  id TEXT NOT NULL PRIMARY KEY,
  aaguid TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  publicKey BLOB NOT NULL,
  userId TEXT NOT NULL,
  webauthnUserId TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  deviceType TEXT NOT NULL,
  backedUp INTEGER NOT NULL DEFAULT 0,
  transports TEXT,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS Passkey_userId_idx ON Passkey(userId);
