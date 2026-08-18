import { describe, expect, it } from "vitest";
import {
  buildContextBundle,
  intersectAllowlists,
} from "./context-bundle-pure.js";

describe("intersectAllowlists", () => {
  it("null layers stay open", () => {
    expect(intersectAllowlists(null, null)).toBeNull();
  });

  it("intersects", () => {
    expect(
      intersectAllowlists(
        ["files.read", "files.write", "git.status"],
        ["files.read", "git.status"],
      ),
    ).toEqual(["files.read", "git.status"]);
  });

  it("empty wins", () => {
    expect(intersectAllowlists(["files.read"], [])).toEqual([]);
  });
});

describe("buildContextBundle", () => {
  it("joins system parts", () => {
    const b = buildContextBundle({
      projectId: "p",
      harnessId: "studio",
      systemParts: ["rules", "", "skills"],
      allowTools: null,
    });
    expect(b.system).toBe("rules\n\nskills");
    expect(b.version).toBe(1);
  });
});
