import { describe, expect, it } from "vitest";
import {
  extractPkValues,
  filterRowToSchema,
  isRecordsWritable,
  pkColumnNames,
} from "./records-mutate-pure.js";

const schema = [
  { name: "id", type: "TEXT", notNull: true, pk: true },
  { name: "email", type: "TEXT", notNull: false, pk: false },
];

describe("pk helpers", () => {
  it("extracts pk", () => {
    expect(pkColumnNames(schema)).toEqual(["id"]);
    expect(extractPkValues(schema, { id: "1", email: "a" })).toEqual({
      id: "1",
    });
  });
});

describe("filterRowToSchema", () => {
  it("drops unknown + optional pk", () => {
    expect(
      filterRowToSchema(schema, { id: "1", email: "a", x: 1 }, { omitPk: true }),
    ).toEqual({ email: "a" });
  });
});

describe("isRecordsWritable", () => {
  it("gates readonly", () => {
    expect(isRecordsWritable({ kind: "d1" })).toBe(true);
    expect(
      isRecordsWritable({ kind: "d1", capabilities: ["records-readonly"] }),
    ).toBe(false);
  });
});
