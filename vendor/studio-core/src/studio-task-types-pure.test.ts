import { describe, expect, it } from "vitest";
import {
  getStudioTaskType,
  parseStudioTaskTypeId,
  studioTaskSpawnPayload,
  STUDIO_TASK_TYPES,
} from "./studio-task-types-pure.js";

describe("studio-task-types-pure", () => {
  it("registry has explore/shell/review/general", () => {
    expect(STUDIO_TASK_TYPES.map((t) => t.id)).toEqual([
      "explore",
      "shell",
      "review",
      "general",
    ]);
  });

  it("parse defaults unknown to general", () => {
    expect(parseStudioTaskTypeId("nope")).toBe("general");
    expect(getStudioTaskType("explore")?.label).toBe("Explore");
  });

  it("spawn payload prefixes prompt", () => {
    const p = studioTaskSpawnPayload({
      typeId: "explore",
      userPrompt: "find auth bugs",
      parentChatId: "p1",
    });
    expect(p.parentChatId).toBe("p1");
    expect(p.label).toBe("Explore");
    expect(p.intent).toMatch(/Explore/);
    expect(p.intent).toMatch(/find auth bugs/);
    expect(p.allowTools).toContain("files.read");
  });
});
