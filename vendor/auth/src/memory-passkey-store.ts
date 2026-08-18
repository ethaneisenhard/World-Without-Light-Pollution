import type { PasskeyRecord, PasskeyStore } from "./passkey-types.js";

export function createMemoryPasskeyStore(seeds: PasskeyRecord[] = []): PasskeyStore {
  const byId = new Map<string, PasskeyRecord>();
  for (const s of seeds) byId.set(s.id, { ...s, publicKey: new Uint8Array(s.publicKey) });

  return {
    async listByUserId(userId) {
      return [...byId.values()].filter((p) => p.userId === userId);
    },
    async getById(id) {
      const row = byId.get(id);
      return row ? { ...row, publicKey: new Uint8Array(row.publicKey) } : null;
    },
    async upsert(record) {
      const next = { ...record, publicKey: new Uint8Array(record.publicKey) };
      byId.set(next.id, next);
      return { ...next, publicKey: new Uint8Array(next.publicKey) };
    },
    async deleteById(id, userId) {
      const row = byId.get(id);
      if (!row || row.userId !== userId) return false;
      byId.delete(id);
      return true;
    },
    async updateCounter(id, counter) {
      const row = byId.get(id);
      if (!row) return;
      byId.set(id, { ...row, counter });
    },
  };
}
