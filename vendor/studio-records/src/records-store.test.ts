import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createMemoryRecordsStore } from "./memory-records-store.js";
import {
  createLocalSqliteRecordsStore,
  createNodeSqliteExecutor,
  ensureIdealRecordsSchema,
} from "./node-sqlite.js";
import {
  parseDataDestination,
  resolveStorageDestinationId,
} from "./destination-pure.js";
import { isRecordsCapable } from "./types.js";

describe("destination-pure", () => {
  it("parses destination + storage routing", () => {
    const dest = parseDataDestination({
      id: "primary-d1",
      kind: "d1",
      label: "Primary D1",
      localPath: ".data/primary.sqlite",
      capabilities: ["records", "forms"],
    });
    expect(dest?.id).toBe("primary-d1");
    expect(isRecordsCapable(dest!)).toBe(true);
    expect(
      resolveStorageDestinationId({ records: "primary-d1" }, "records"),
    ).toBe("primary-d1");
  });
});

describe("memory RecordsStore", () => {
  it("lists and queries", async () => {
    const store = createMemoryRecordsStore({
      contacts: [
        { id: "1", email: "a@ex.com" },
        { id: "2", email: "b@ex.com" },
      ],
    });
    const tables = await store.listTables();
    expect(tables[0]?.name).toBe("contacts");
    expect(tables[0]?.rowCount).toBe(2);
    const q = await store.query({ table: "contacts", limit: 1 });
    expect(q.rows).toHaveLength(1);
    expect(q.total).toBe(2);
  });

  it("sorts and searches", async () => {
    const store = createMemoryRecordsStore({
      contacts: [
        { id: "2", email: "b@ex.com" },
        { id: "1", email: "a@ex.com" },
        { id: "3", email: "other@x.com" },
      ],
    });
    const sorted = await store.query({
      table: "contacts",
      sortBy: "email",
      sortDir: "asc",
    });
    expect(sorted.rows.map((r) => r.email)).toEqual([
      "a@ex.com",
      "b@ex.com",
      "other@x.com",
    ]);
    const filtered = await store.query({ table: "contacts", q: "a@ex" });
    expect(filtered.total).toBe(1);
    expect(filtered.rows[0]?.email).toBe("a@ex.com");
  });

  it("inserts updates deletes by pk", async () => {
    const store = createMemoryRecordsStore({
      contacts: [{ id: "1", email: "a@ex.com" }],
    });
    await store.insertRow("contacts", { id: "2", email: "b@ex.com" });
    expect((await store.query({ table: "contacts" })).total).toBe(2);
    await store.updateRow("contacts", { id: "2" }, { email: "bb@ex.com" });
    const after = await store.query({ table: "contacts", q: "bb@" });
    expect(after.rows[0]?.email).toBe("bb@ex.com");
    await store.deleteRow("contacts", { id: "1" });
    expect((await store.query({ table: "contacts" })).total).toBe(1);
  });
});

describe("sqlite RecordsStore", () => {
  it("seeds schema and browses tables", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "as-records-"));
    try {
      const dbPath = path.join(dir, "primary.sqlite");
      const sql = createNodeSqliteExecutor(dbPath);
      await ensureIdealRecordsSchema(sql);
      await sql.run(
        `INSERT INTO form_submissions (id, form_id, payload_json, created_at)
         VALUES (?, ?, ?, ?)`,
        ["sub_1", "contact", '{"email":"x@y.z"}', Date.now()],
      );
      const store = createLocalSqliteRecordsStore(dbPath);
      const tables = await store.listTables();
      expect(tables.map((t) => t.name)).toContain("form_submissions");
      expect(tables.map((t) => t.name)).toContain("users");
      const rows = await store.query({ table: "form_submissions" });
      expect(rows.rows[0]?.form_id).toBe("contact");
      const cols = await store.describeTable("form_submissions");
      expect(cols.some((c) => c.name === "payload_json")).toBe(true);

      const { createSqlProjectUsersStore } = await import(
        "./sql-project-users.js"
      );
      const users = createSqlProjectUsersStore(sql);
      const u = await users.upsert({
        email: "Lead@Ex.com",
        name: "Lead",
        roles: ["lead"],
        source: "form:contact",
      });
      expect(u.email).toBe("lead@ex.com");
      const again = await users.upsert({
        email: "lead@ex.com",
        roles: ["subscriber"],
      });
      expect(again.roles.sort()).toEqual(["lead", "subscriber"]);
      expect(await users.count()).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
