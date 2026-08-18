import { describe, expect, it } from "vitest";
import { canvasWindowIds } from "./canvas-window-registry-pure.js";
import { describeToolSchema } from "./tool-catalog-pure.js";
import {
  parseStudioNavChatIntent,
  parseStudioNavInput,
  studioNavKindEnumDescription,
  studioNavKindIds,
} from "./studio-nav-pure.js";

describe("parseStudioNavInput", () => {
  it("opens a single kind", () => {
    expect(parseStudioNavInput({ kind: "live" })).toEqual({
      ok: true,
      command: { kinds: ["live"], focus: "live" },
    });
  });

  it("opens Notes DeskPane via kind=notes (not a file)", () => {
    expect(parseStudioNavInput({ kind: "notes" })).toEqual({
      ok: true,
      command: { kinds: ["notes"], focus: "notes" },
    });
  });

  it("accepts every registry canvas kind", () => {
    for (const id of canvasWindowIds()) {
      const r = parseStudioNavInput({ kind: id });
      expect(r.ok, id).toBe(true);
      if (!r.ok) continue;
      expect(r.command.kinds).toEqual([id]);
      expect(r.command.focus).toBe(id);
    }
  });

  it("opens live with path and implies live kind", () => {
    expect(parseStudioNavInput({ livePath: "pricing" })).toEqual({
      ok: true,
      command: { kinds: ["live"], focus: "live", livePath: "/pricing" },
    });
  });

  it("opens code with filePath", () => {
    expect(parseStudioNavInput({ filePath: "content/pages/home.md" })).toEqual({
      ok: true,
      command: {
        kinds: ["code"],
        focus: "code",
        filePath: "content/pages/home.md",
      },
    });
  });

  it("preferDesign opens design + code", () => {
    const r = parseStudioNavInput({
      filePath: "content/pages/home.md",
      preferDesign: true,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.command.kinds).toContain("design");
    expect(r.command.kinds).toContain("code");
    expect(r.command.focus).toBe("design");
    expect(r.command.preferDesign).toBe(true);
  });

  it("closes kinds", () => {
    expect(parseStudioNavInput({ kind: "live", close: true })).toEqual({
      ok: true,
      command: { kinds: ["live"], focus: "live", close: true },
    });
    expect(parseStudioNavInput({ kinds: ["settings"], action: "close" })).toEqual({
      ok: true,
      command: { kinds: ["settings"], focus: "settings", close: true },
    });
  });

  it("split layout opens panes", () => {
    const r = parseStudioNavInput({
      layout: "split",
      splitPanes: ["code", "live"],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.command.layout).toBe("split");
    expect(r.command.splitPanes).toEqual(["code", "live"]);
    expect(r.command.kinds).toEqual(["code", "live"]);
  });

  it("projectId and tab alone", () => {
    expect(parseStudioNavInput({ projectId: "demo-blog", tab: "files" })).toEqual({
      ok: true,
      command: { kinds: [], projectId: "demo-blog", tab: "files" },
    });
  });

  it("disambiguates bare path", () => {
    expect(parseStudioNavInput({ path: "pricing" }).ok).toBe(true);
    expect(parseStudioNavInput({ path: "content/pages/home.md" })).toEqual({
      ok: true,
      command: {
        kinds: ["code"],
        focus: "code",
        filePath: "content/pages/home.md",
      },
    });
  });

  it("rejects escaping filePath", () => {
    expect(parseStudioNavInput({ filePath: "../secret" }).ok).toBe(false);
  });

  it("rejects unknown kind", () => {
    expect(parseStudioNavInput({ kind: "nope" }).ok).toBe(false);
  });

  it("opens design with ds surface", () => {
    expect(parseStudioNavInput({ ds: "system" })).toEqual({
      ok: true,
      command: { kinds: ["design"], focus: "design", ds: "system" },
    });
    expect(parseStudioNavInput({ kind: "design", ds: "chrome" }).ok).toBe(true);
    expect(parseStudioNavInput({ ds: "nope" }).ok).toBe(false);
  });
});

describe("parseStudioNavChatIntent", () => {
  it("opens live / that page", () => {
    expect(parseStudioNavChatIntent("bring me to that page so I can see")).toEqual({
      kinds: ["live"],
      focus: "live",
    });
    expect(parseStudioNavChatIntent('show me the page at "/pricing"')).toEqual({
      kinds: ["live"],
      focus: "live",
      livePath: "/pricing",
    });
  });

  it("closes a window", () => {
    expect(parseStudioNavChatIntent("close the live window")).toEqual({
      kinds: ["live"],
      close: true,
    });
  });

  it("splits code and live", () => {
    const r = parseStudioNavChatIntent("split code and live");
    expect(r?.layout).toBe("split");
    expect(r?.splitPanes).toEqual(["code", "live"]);
  });

  it("opens settings AI", () => {
    expect(parseStudioNavChatIntent("open settings AI")).toEqual({
      kinds: ["settings"],
      focus: "settings",
      ssect: "ai",
    });
  });

  it("opens a project file", () => {
    expect(
      parseStudioNavChatIntent('open the file "content/pages/home.md"'),
    ).toEqual({
      kinds: ["code"],
      focus: "code",
      filePath: "content/pages/home.md",
    });
  });

  it("opens Notes window from natural language", () => {
    expect(parseStudioNavChatIntent("open the notes")).toEqual({
      kinds: ["notes"],
      focus: "notes",
    });
  });

  it("opens converter from registry-derived chat intent", () => {
    expect(parseStudioNavChatIntent("open the converter")).toEqual({
      kinds: ["converter"],
      focus: "converter",
    });
  });

  it("opens files rail", () => {
    expect(parseStudioNavChatIntent("show the files tree")).toEqual({
      kinds: [],
      tab: "files",
    });
  });

  it("ignores unrelated", () => {
    expect(parseStudioNavChatIntent("fix the hero copy")).toBeNull();
  });
});

describe("studio.nav kind enum ↔ registry", () => {
  it("tool schema enum lists every canvas window id including notes", () => {
    expect(studioNavKindIds()).toEqual([...canvasWindowIds()]);
    expect(studioNavKindEnumDescription()).toContain("notes");
    expect(studioNavKindEnumDescription()).toContain("converter");
    const schema = describeToolSchema("studio.nav");
    const kindProp = (schema.input_schema.properties as Record<string, { enum?: string[] }>)
      .kind;
    expect(kindProp?.enum).toEqual([...canvasWindowIds()]);
    expect(kindProp?.enum).toContain("notes");
  });
});
