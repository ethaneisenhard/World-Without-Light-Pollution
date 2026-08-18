import { describe, expect, it } from "vitest";
import { readSeedUserConfig, seedUserSql } from "./seed-pure.js";

describe("readSeedUserConfig", () => {
  it("returns null when incomplete", () => {
    expect(readSeedUserConfig({ DEV_SEED_EMAIL: "a@b.com" })).toBeNull();
  });

  it("parses seed user", () => {
    expect(
      readSeedUserConfig({
        DEV_SEED_EMAIL: "you@example.com",
        DEV_SEED_USERNAME: "admin",
        DEV_SEED_PASSWORD: "secret",
        DEV_SEED_ROLE: "SUBSCRIBER",
      }),
    ).toEqual({
      id: "seed-admin",
      email: "you@example.com",
      username: "admin",
      password: "secret",
      name: "admin",
      role: "SUBSCRIBER",
    });
  });
});

describe("seedUserSql", () => {
  it("upserts user row", () => {
    expect(
      seedUserSql(
        {
          id: "seed-admin",
          email: "you@example.com",
          username: "admin",
          password: "secret",
          name: "Admin",
          role: "MEMBER",
        },
        "hash:val",
      ),
    ).toContain("INSERT INTO User");
  });
});
