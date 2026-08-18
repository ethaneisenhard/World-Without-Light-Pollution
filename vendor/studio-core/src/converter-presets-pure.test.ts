import { describe, expect, it } from "vitest";
import {
  CONVERTER_PRESETS,
  buildFfmpegArgs,
  getConverterPreset,
  isConverterPresetId,
  listConverterPresetIds,
  outputFilenameForPreset,
} from "./converter-presets-pure.js";

describe("converter-presets-pure", () => {
  it("lists all PRD presets", () => {
    expect(listConverterPresetIds().sort()).toEqual(
      [
        "gif",
        "image-png",
        "image-webp",
        "mp3",
        "mp4-h264",
        "webm-vp9",
      ].sort(),
    );
    expect(CONVERTER_PRESETS).toHaveLength(6);
  });

  it("rejects unknown preset", () => {
    expect(isConverterPresetId("nope")).toBe(false);
    expect(getConverterPreset("nope")).toBe(null);
    expect(
      buildFfmpegArgs({
        presetId: "nope",
        inputPath: "/a.mp4",
        outputPath: "/b.mp4",
      }).ok,
    ).toBe(false);
  });

  it("builds argv without shell strings for each preset", () => {
    for (const p of CONVERTER_PRESETS) {
      const r = buildFfmpegArgs({
        presetId: p.id,
        inputPath: "/in/file.bin",
        outputPath: `/out/file.${p.ext}`,
      });
      expect(r.ok).toBe(true);
      if (!r.ok) continue;
      expect(r.args[0]).toBe("-y");
      expect(r.args).toContain("/in/file.bin");
      expect(r.args.at(-1)).toBe(`/out/file.${p.ext}`);
      expect(r.args.join(" ")).not.toMatch(/;|&&|\|/);
    }
  });

  it("names output from basename + ext", () => {
    expect(outputFilenameForPreset("Holiday Clip.MOV", "mp4-h264")).toBe(
      "Holiday_Clip.mp4",
    );
    expect(outputFilenameForPreset("x", "mp3")).toBe("x.mp3");
  });
});
