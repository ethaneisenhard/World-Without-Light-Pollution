import { describe, expect, it } from "vitest";
import {
  buildDbhubSqliteDsn,
  dbhubStdioNpxArgs,
  defaultDbhubD1StandInPath,
} from "./dbhub-dsn-pure.js";

describe("buildDbhubSqliteDsn", () => {
  it("formats unix absolute paths", () => {
    expect(buildDbhubSqliteDsn("/tmp/proj/.data/primary-d1.sqlite")).toBe(
      "sqlite:///tmp/proj/.data/primary-d1.sqlite",
    );
  });

  it("formats relative project paths", () => {
    expect(buildDbhubSqliteDsn(".data/primary-d1.sqlite")).toBe(
      "sqlite:///.data/primary-d1.sqlite",
    );
  });

  it("passes through existing dsn", () => {
    expect(buildDbhubSqliteDsn("sqlite:///:memory:")).toBe("sqlite:///:memory:");
  });
});

describe("defaultDbhubD1StandInPath / dbhubStdioNpxArgs", () => {
  it("defaults destination file", () => {
    expect(defaultDbhubD1StandInPath("primary-d1")).toBe(
      ".data/primary-d1.sqlite",
    );
  });

  it("builds npx args", () => {
    const dsn = buildDbhubSqliteDsn(".data/primary-d1.sqlite");
    expect(dbhubStdioNpxArgs({ dsn, id: "studio-d1" })).toEqual([
      "-y",
      "@bytebase/dbhub@latest",
      "--transport",
      "stdio",
      "--dsn",
      dsn,
      "--id",
      "studio-d1",
    ]);
  });
});
