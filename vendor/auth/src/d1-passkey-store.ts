import type { PasskeyRecord, PasskeyStore } from "./passkey-types.js";

/** Minimal D1 surface — avoids hard dep on workers-types in pure package tests. */
export type D1DatabaseLike = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => {
      first: <T>() => Promise<T | null>;
      all: <T>() => Promise<{ results?: T[] }>;
      run: () => Promise<{ meta?: { changes?: number } }>;
    };
  };
};

type PasskeyRow = {
  id: string;
  aaguid: string;
  publicKey: ArrayBuffer | Uint8Array;
  userId: string;
  webauthnUserId: string;
  counter: number;
  deviceType: string;
  backedUp: number;
  transports: string | null;
  createdAt?: string;
  updatedAt?: string;
};

function toRecord(row: PasskeyRow): PasskeyRecord {
  const pk =
    row.publicKey instanceof Uint8Array
      ? row.publicKey
      : new Uint8Array(row.publicKey);
  return {
    id: row.id,
    aaguid: row.aaguid,
    publicKey: pk,
    userId: row.userId,
    webauthnUserId: row.webauthnUserId,
    counter: Number(row.counter),
    deviceType: row.deviceType,
    backedUp: row.backedUp === 1,
    transports: row.transports,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** D1 Passkey store — Kent schema from `migrations/0001_init.sql`. */
export function createD1PasskeyStore(db: D1DatabaseLike): PasskeyStore {
  return {
    async listByUserId(userId) {
      const { results } = await db
        .prepare(
          `SELECT id, aaguid, publicKey, userId, webauthnUserId, counter, deviceType, backedUp, transports, createdAt, updatedAt
           FROM Passkey WHERE userId = ?`,
        )
        .bind(userId)
        .all<PasskeyRow>();
      return (results ?? []).map(toRecord);
    },
    async getById(id) {
      const row = await db
        .prepare(
          `SELECT id, aaguid, publicKey, userId, webauthnUserId, counter, deviceType, backedUp, transports, createdAt, updatedAt
           FROM Passkey WHERE id = ?`,
        )
        .bind(id)
        .first<PasskeyRow>();
      return row ? toRecord(row) : null;
    },
    async upsert(record) {
      await db
        .prepare(
          `INSERT INTO Passkey (id, aaguid, publicKey, userId, webauthnUserId, counter, deviceType, backedUp, transports, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
           ON CONFLICT(id) DO UPDATE SET
             aaguid = excluded.aaguid,
             publicKey = excluded.publicKey,
             userId = excluded.userId,
             webauthnUserId = excluded.webauthnUserId,
             counter = excluded.counter,
             deviceType = excluded.deviceType,
             backedUp = excluded.backedUp,
             transports = excluded.transports,
             updatedAt = datetime('now')`,
        )
        .bind(
          record.id,
          record.aaguid,
          record.publicKey,
          record.userId,
          record.webauthnUserId,
          record.counter,
          record.deviceType,
          record.backedUp ? 1 : 0,
          record.transports,
        )
        .run();
      return record;
    },
    async deleteById(id, userId) {
      const result = await db
        .prepare(`DELETE FROM Passkey WHERE id = ? AND userId = ?`)
        .bind(id, userId)
        .run();
      return (result.meta?.changes ?? 0) > 0;
    },
    async updateCounter(id, counter) {
      await db
        .prepare(
          `UPDATE Passkey SET counter = ?, updatedAt = datetime('now') WHERE id = ?`,
        )
        .bind(counter, id)
        .run();
    },
  };
}
