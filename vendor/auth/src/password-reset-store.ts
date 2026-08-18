/**
 * Password-reset token persistence — memory (tests) + D1 (Workers).
 */
import type { D1DatabaseLike } from "./d1-passkey-store.js";
import {
  createPasswordResetToken,
  hashPasswordResetToken,
  isPasswordResetExpired,
  passwordResetExpiresAtIso,
} from "./password-reset-pure.js";

export type PasswordResetTokenRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  usedAt: string | null;
};

export type PasswordResetTokenStore = {
  /** Create a fresh token for user; returns raw token for email. */
  issue: (userId: string) => Promise<{ raw: string; expiresAt: string }>;
  /** Consume valid unused token → userId, or null. */
  consume: (rawToken: string) => Promise<string | null>;
};

type MemoryRow = PasswordResetTokenRecord;

export function createMemoryPasswordResetTokenStore(): PasswordResetTokenStore {
  const byHash = new Map<string, MemoryRow>();

  return {
    async issue(userId) {
      const { raw, hash } = await createPasswordResetToken();
      const expiresAt = passwordResetExpiresAtIso();
      const id = `prt_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
      byHash.set(hash, {
        id,
        userId,
        tokenHash: hash,
        expiresAt,
        usedAt: null,
      });
      return { raw, expiresAt };
    },
    async consume(rawToken) {
      const hash = await hashPasswordResetToken(rawToken);
      const row = byHash.get(hash);
      if (!row || row.usedAt || isPasswordResetExpired(row.expiresAt)) return null;
      row.usedAt = new Date().toISOString();
      return row.userId;
    },
  };
}

export function createD1PasswordResetTokenStore(
  db: D1DatabaseLike,
): PasswordResetTokenStore {
  return {
    async issue(userId) {
      const { raw, hash } = await createPasswordResetToken();
      const expiresAt = passwordResetExpiresAtIso();
      const id = `prt_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
      await db
        .prepare(
          `INSERT INTO PasswordResetToken (id, userId, tokenHash, expiresAt)
           VALUES (?, ?, ?, ?)`,
        )
        .bind(id, userId, hash, expiresAt)
        .run();
      return { raw, expiresAt };
    },
    async consume(rawToken) {
      const hash = await hashPasswordResetToken(rawToken);
      const row = await db
        .prepare(
          `SELECT id, userId, tokenHash, expiresAt, usedAt
           FROM PasswordResetToken WHERE tokenHash = ? LIMIT 1`,
        )
        .bind(hash)
        .first<PasswordResetTokenRecord>();
      if (!row || row.usedAt || isPasswordResetExpired(row.expiresAt)) return null;
      const usedAt = new Date().toISOString();
      const updated = await db
        .prepare(
          `UPDATE PasswordResetToken SET usedAt = ?
           WHERE id = ? AND usedAt IS NULL`,
        )
        .bind(usedAt, row.id)
        .run();
      if ((updated.meta?.changes ?? 0) < 1) return null;
      return row.userId;
    },
  };
}
