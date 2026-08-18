import { describe, expect, it } from "vitest";
import { parseGlobalFilePath } from "./global-file-access-pure.js";
import {
  assertNoLeakedPathAlias,
  normalizeFileRelSentinel,
  toDiskRel,
} from "./global-file-path-sentinel-pure.js";

describe("global-file-path-sentinel (Hermes discipline)", () => {
  it("collapses rel sentinels to root", () => {
    expect(normalizeFileRelSentinel("")).toBe("");
    expect(normalizeFileRelSentinel(".")).toBe("");
    expect(normalizeFileRelSentinel("./")).toBe("");
    expect(normalizeFileRelSentinel("apps/studio")).toBe("apps/studio");
  });

  it("toDiskRel: sentinel → empty; nested OK; escape rejects", () => {
    expect(toDiskRel(".")).toBe("");
    expect(toDiskRel("./")).toBe("");
    expect(toDiskRel("apps/studio/client/x.ts")).toBe("apps/studio/client/x.ts");
    expect(toDiskRel("node_modules/@types/node/index.d.ts")).toBe(
      "node_modules/@types/node/index.d.ts",
    );
    expect(() => toDiskRel("../secret")).toThrow(/escapes project root/);
  });

  it("refuses leaked @studio / @ws as disk rel (first segment)", () => {
    expect(() => assertNoLeakedPathAlias("@studio")).toThrow(/leaked/);
    expect(() => assertNoLeakedPathAlias("@studio/apps")).toThrow(/leaked/);
    expect(() => toDiskRel("@studio")).toThrow(/leaked/);
    expect(() => toDiskRel("@ws")).toThrow(/leaked/);
    expect(() => toDiskRel("@ws/demo-blog/src")).toThrow(/leaked/);
  });

  it("parse matrix: aliases never become scoped disk paths", () => {
    const studio = parseGlobalFilePath("@studio");
    expect(studio).toEqual({ kind: "studio", rel: "" });
    expect(studio.kind).not.toBe("scoped");
    if (studio.kind === "studio") expect(toDiskRel(studio.rel)).toBe("");

    expect(parseGlobalFilePath("@studio/")).toEqual({ kind: "studio", rel: "" });
    const nested = parseGlobalFilePath("@studio/apps");
    expect(nested).toEqual({ kind: "studio", rel: "apps" });
    if (nested.kind === "studio") expect(toDiskRel(nested.rel)).toBe("apps");

    const bareWs = parseGlobalFilePath("@ws");
    expect(bareWs).toEqual({ kind: "workspace", projectId: "", rel: "" });
    expect(bareWs.kind).not.toBe("scoped");

    expect(parseGlobalFilePath("@ws/demo-blog")).toEqual({
      kind: "workspace",
      projectId: "demo-blog",
      rel: "",
    });
    expect(parseGlobalFilePath("@ws/demo-blog/src/x.ts")).toEqual({
      kind: "workspace",
      projectId: "demo-blog",
      rel: "src/x.ts",
    });
    expect(parseGlobalFilePath("apps")).toEqual({ kind: "scoped", path: "apps" });
    expect(toDiskRel("apps")).toBe("apps");
    expect(toDiskRel(".")).toBe("");
  });
});
