import { describe, expect, it } from "vitest";
import { createMemoryPasskeyStore } from "./memory-passkey-store.js";

const sample = {
  id: "cred1",
  aaguid: "00000000-0000-0000-0000-000000000000",
  publicKey: new Uint8Array([1, 2, 3]),
  userId: "u1",
  webauthnUserId: "wu1",
  counter: 0,
  deviceType: "platform",
  backedUp: true,
  transports: "internal",
};

describe("createMemoryPasskeyStore", () => {
  it("lists upserts and deletes by user", async () => {
    const store = createMemoryPasskeyStore([sample]);
    expect(await store.listByUserId("u1")).toHaveLength(1);
    await store.updateCounter("cred1", 2);
    expect((await store.getById("cred1"))?.counter).toBe(2);
    expect(await store.deleteById("cred1", "other")).toBe(false);
    expect(await store.deleteById("cred1", "u1")).toBe(true);
    expect(await store.listByUserId("u1")).toHaveLength(0);
  });
});
