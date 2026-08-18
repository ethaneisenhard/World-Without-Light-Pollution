/**
 * Parity oracles for Studio MCP control plane Wave 1.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { canvasWindowIds } from "./canvas-window-registry-pure.js";
import { describeToolSchema } from "./tool-catalog-pure.js";
import { DEFAULT_WINDOW_COLOR_PALETTE } from "./window-colors-pure.js";

const REPO_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../",
);

describe("studio MCP control plane parity", () => {
  it("studio.windows.list schema exists", () => {
    const schema = describeToolSchema("studio.windows.list");
    expect(schema.id).toBe("studio.windows.list");
    expect(schema.description.toLowerCase()).toContain("notes");
  });

  it("windowColors.set kind/hue enums cover registry + palette", () => {
    const schema = describeToolSchema("studio.windowColors.set");
    const props = schema.input_schema.properties as Record<
      string,
      { enum?: string[] }
    >;
    for (const id of canvasWindowIds()) {
      expect(props.kind?.enum).toContain(id);
    }
    for (const hue of DEFAULT_WINDOW_COLOR_PALETTE) {
      expect(props.hue?.enum).toContain(hue.id);
    }
  });

  it("studio.nav layout/tab enums locked", () => {
    const schema = describeToolSchema("studio.nav");
    const props = schema.input_schema.properties as Record<
      string,
      { enum?: string[] }
    >;
    expect(props.layout?.enum).toEqual(["split", "single"]);
    expect(props.tab?.enum).toEqual(["nav", "files", "ai"]);
    expect(props.ds?.description).toMatch(/home\|system\|components\|chrome/);
    expect(props.splitPanes?.items).toMatchObject({
      enum: [...canvasWindowIds()],
    });
  });

  it("repo harness allowlist includes control-plane tools", () => {
    const raw = readFileSync(
      join(REPO_ROOT, ".glassbox-studio/harness.json"),
      "utf8",
    );
    const harness = JSON.parse(raw) as { allowTools?: string[] };
    const allow = new Set(harness.allowTools ?? []);
    for (const id of [
      "studio.nav",
      "studio.windows.list",
      "studio.windowColors.set",
      "studio.experience.get",
      "studio.experience.set",
      "studio.experience.patch",
      "studio.workspace.list",
      "studio.dock.set",
      "studio.home.get",
      "studio.home.set",
      "studio.home.patch",
      "studio.home.widgets.list",
    ]) {
      expect(allow.has(id), id).toBe(true);
    }
  });
});
