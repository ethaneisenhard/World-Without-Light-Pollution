/**
 * D1 User + credential store (Worker). Same schema as auth migrations 0001–0002.
 */
import type { D1DatabaseLike } from "./d1-passkey-store.js";
import type { MemorySeed } from "./memory-user-store.js";
import type { AuthUser, CredentialRecord, CredentialStore, UserStore } from "./types.js";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: "MEMBER" | "SUBSCRIBER";
  username: string | null;
  passwordHash: string | null;
};

function rowToUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name ?? undefined,
    role: row.role,
  };
}

export type D1AuthStore = UserStore &
  CredentialStore & {
    register: (
      seed: MemorySeed,
    ) => Promise<
      | { ok: true; user: AuthUser }
      | { ok: false; error: "email_taken" | "username_taken" | "id_taken" }
    >;
    getByEmail: (email: string) => Promise<AuthUser | null>;
    updatePasswordHash: (userId: string, passwordHash: string) => Promise<void>;
  };

export function createD1AuthStores(db: D1DatabaseLike): D1AuthStore {
  return {
    async upsert(user) {
      await db
        .prepare(
          `INSERT INTO User (id, email, name, role, username)
           VALUES (?, ?, ?, ?, COALESCE((SELECT username FROM User WHERE id = ?), NULL))
           ON CONFLICT(id) DO UPDATE SET
             email = excluded.email,
             name = excluded.name,
             role = excluded.role`,
        )
        .bind(user.id, user.email, user.name ?? null, user.role, user.id)
        .run();
      return user;
    },
    async getById(id) {
      const row = await db
        .prepare(
          `SELECT id, email, name, role, username, passwordHash FROM User WHERE id = ?`,
        )
        .bind(id)
        .first<UserRow>();
      return row ? rowToUser(row) : null;
    },
    async getByEmail(email) {
      const row = await db
        .prepare(
          `SELECT id, email, name, role, username, passwordHash FROM User WHERE lower(email) = lower(?) LIMIT 1`,
        )
        .bind(email.trim())
        .first<UserRow>();
      return row ? rowToUser(row) : null;
    },
    async updatePasswordHash(userId, passwordHash) {
      await db
        .prepare(`UPDATE User SET passwordHash = ? WHERE id = ?`)
        .bind(passwordHash, userId)
        .run();
    },
    async findByLogin(login) {
      const row = await db
        .prepare(
          `SELECT id, email, name, role, username, passwordHash
           FROM User
           WHERE lower(email) = lower(?) OR lower(username) = lower(?)
           LIMIT 1`,
        )
        .bind(login, login)
        .first<UserRow>();
      if (!row?.passwordHash) return null;
      return {
        user: rowToUser(row),
        passwordHash: row.passwordHash,
      } satisfies CredentialRecord;
    },
    async register(seed) {
      const emailHit = await db
        .prepare(`SELECT id FROM User WHERE lower(email) = lower(?) LIMIT 1`)
        .bind(seed.user.email)
        .first<{ id: string }>();
      if (emailHit) return { ok: false, error: "email_taken" };

      if (seed.username) {
        const userHit = await db
          .prepare(
            `SELECT id FROM User WHERE username IS NOT NULL AND lower(username) = lower(?) LIMIT 1`,
          )
          .bind(seed.username)
          .first<{ id: string }>();
        if (userHit) return { ok: false, error: "username_taken" };
      }

      const idHit = await db
        .prepare(`SELECT id FROM User WHERE id = ? LIMIT 1`)
        .bind(seed.user.id)
        .first<{ id: string }>();
      if (idHit) return { ok: false, error: "id_taken" };

      await db
        .prepare(
          `INSERT INTO User (id, email, name, role, username, passwordHash)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          seed.user.id,
          seed.user.email,
          seed.user.name ?? null,
          seed.user.role,
          seed.username ?? null,
          seed.passwordHash,
        )
        .run();

      return { ok: true, user: seed.user };
    },
  };
}
