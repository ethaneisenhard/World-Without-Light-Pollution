import { describe, expect, it } from "vitest";
import { projectImportedMemoryRows } from "./memory-provider-pure.js";
import { hermesMemoryDumpToDrafts } from "./memory-provider-registry-pure.js";

describe("memory-provider-pure", () => {
  it("projects drafts to staged rows", () => {
    const drafts = hermesMemoryDumpToDrafts({
      memories: [{ id: "h1", content: "Likes Hermes" }],
    });
    const rows = projectImportedMemoryRows(drafts, "hermes", 1);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.status).toBe("staged");
    expect(rows[0]!.origin).toBe("harness_synced");
  });
});
