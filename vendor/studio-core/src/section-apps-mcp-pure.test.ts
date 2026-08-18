import { describe, expect, it } from "vitest";
import {
  parseSectionProjectId,
  parseSectionVaultScope,
} from "./section-apps-mcp-pure.js";
import { parseNotesSearchInput, parseNotesWriteInput } from "./notes-mcp-pure.js";
import { parseRoadmapAddInput } from "./roadmap-mcp-pure.js";
import {
  parseCalendarCreateInput,
  parseCalendarListInput,
} from "./calendar-mcp-pure.js";
import { tryDescribeSectionAppTool } from "./tool-schemas-section-apps-pure.js";
import { STUDIO_ROOT_CHAT_ID } from "./chat-pure.js";

describe("parseSectionVaultScope", () => {
  it("defaults studio from Global", () => {
    const r = parseSectionVaultScope({}, STUDIO_ROOT_CHAT_ID);
    expect(r).toEqual({
      ok: true,
      value: { scope: "studio", projectId: null },
    });
  });

  it("defaults project from workspace chat", () => {
    const r = parseSectionVaultScope({}, "glassbox-studio-template");
    expect(r).toEqual({
      ok: true,
      value: { scope: "project", projectId: "glassbox-studio-template" },
    });
  });

  it("requires projectId when forcing project from Global", () => {
    const r = parseSectionVaultScope({ scope: "project" }, STUDIO_ROOT_CHAT_ID);
    expect(r.ok).toBe(false);
  });
});

describe("parseSectionProjectId", () => {
  it("requires workspace from Global", () => {
    expect(parseSectionProjectId({}, STUDIO_ROOT_CHAT_ID).ok).toBe(false);
  });

  it("uses chat workspace", () => {
    expect(parseSectionProjectId({}, "demo-blog")).toEqual({
      ok: true,
      value: "demo-blog",
    });
  });
});

describe("notes / roadmap / calendar parse", () => {
  it("notes.search accepts q alias", () => {
    const r = parseNotesSearchInput({ q: "hello" }, STUDIO_ROOT_CHAT_ID);
    expect(r.ok && r.value.query).toBe("hello");
  });

  it("notes.write requires content", () => {
    const r = parseNotesWriteInput(
      { path: "a.md" },
      STUDIO_ROOT_CHAT_ID,
    );
    expect(r.ok).toBe(false);
  });

  it("roadmap.add requires title", () => {
    const r = parseRoadmapAddInput({}, STUDIO_ROOT_CHAT_ID);
    expect(r.ok).toBe(false);
  });

  it("calendar.create parses ISO startsAt", () => {
    const r = parseCalendarCreateInput(
      { title: "Meet", startsAt: "2026-07-22T15:00:00.000Z" },
      STUDIO_ROOT_CHAT_ID,
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.startsAt).toBe(Date.parse("2026-07-22T15:00:00.000Z"));
      expect(r.value.scope).toBe("studio");
    }
  });

  it("calendar.list defaults project filter from chat", () => {
    const r = parseCalendarListInput({}, "demo-blog");
    expect(r.ok && r.value.projectId).toBe("demo-blog");
  });
});

describe("tryDescribeSectionAppTool", () => {
  it("owns notes/roadmap/calendar ids", () => {
    expect(tryDescribeSectionAppTool("notes.list", "d")?.input_schema).toBeTruthy();
    expect(tryDescribeSectionAppTool("roadmap.move", "d")?.input_schema).toBeTruthy();
    expect(tryDescribeSectionAppTool("calendar.create", "d")?.input_schema).toBeTruthy();
    expect(tryDescribeSectionAppTool("messages.list", "d")).toBeNull();
  });
});
