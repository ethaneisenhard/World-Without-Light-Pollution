/**
 * File Converter presets — curated FFmpeg argv only (no free-form flags).
 */

export type ConverterPresetId =
  | "mp4-h264"
  | "webm-vp9"
  | "mp3"
  | "gif"
  | "image-webp"
  | "image-png";

export type ConverterPreset = {
  id: ConverterPresetId;
  label: string;
  /** Output file extension (no dot). */
  ext: string;
  /** Rough kind for UI filters. */
  kind: "video" | "audio" | "image" | "gif";
};

export const CONVERTER_PRESETS: readonly ConverterPreset[] = [
  {
    id: "mp4-h264",
    label: "MP4 (H.264 + AAC)",
    ext: "mp4",
    kind: "video",
  },
  {
    id: "webm-vp9",
    label: "WebM (VP9)",
    ext: "webm",
    kind: "video",
  },
  { id: "mp3", label: "MP3 audio", ext: "mp3", kind: "audio" },
  { id: "gif", label: "GIF (short clip)", ext: "gif", kind: "gif" },
  { id: "image-webp", label: "WebP image", ext: "webp", kind: "image" },
  { id: "image-png", label: "PNG image", ext: "png", kind: "image" },
] as const;

const PRESET_BY_ID = new Map(CONVERTER_PRESETS.map((p) => [p.id, p]));

export function isConverterPresetId(raw: string): raw is ConverterPresetId {
  return PRESET_BY_ID.has(raw as ConverterPresetId);
}

export function getConverterPreset(
  id: string,
): ConverterPreset | null {
  return PRESET_BY_ID.get(id as ConverterPresetId) ?? null;
}

export function listConverterPresetIds(): ConverterPresetId[] {
  return CONVERTER_PRESETS.map((p) => p.id);
}

/**
 * Build ffmpeg argv (no binary). Paths must already be jail-validated.
 * Never interpolates into a shell string — spawn with this array.
 */
export function buildFfmpegArgs(input: {
  presetId: string;
  inputPath: string;
  outputPath: string;
}): { ok: true; args: string[] } | { ok: false; error: string } {
  const preset = getConverterPreset(input.presetId);
  if (!preset) {
    return {
      ok: false,
      error: `Unknown preset: ${input.presetId}. Valid: ${listConverterPresetIds().join(", ")}`,
    };
  }
  const inPath = input.inputPath.trim();
  const outPath = input.outputPath.trim();
  if (!inPath || !outPath) {
    return { ok: false, error: "inputPath and outputPath required" };
  }

  const common = ["-y", "-hide_banner", "-i", inPath];

  switch (preset.id) {
    case "mp4-h264":
      return {
        ok: true,
        args: [
          ...common,
          "-c:v",
          "libx264",
          "-preset",
          "medium",
          "-crf",
          "23",
          "-c:a",
          "aac",
          "-b:a",
          "128k",
          "-movflags",
          "+faststart",
          outPath,
        ],
      };
    case "webm-vp9":
      return {
        ok: true,
        args: [
          ...common,
          "-c:v",
          "libvpx-vp9",
          "-crf",
          "32",
          "-b:v",
          "0",
          "-c:a",
          "libopus",
          "-b:a",
          "96k",
          outPath,
        ],
      };
    case "mp3":
      return {
        ok: true,
        args: [...common, "-vn", "-c:a", "libmp3lame", "-q:a", "2", outPath],
      };
    case "gif":
      // Cap length / fps for sane GIF sizes
      return {
        ok: true,
        args: [
          ...common,
          "-t",
          "8",
          "-vf",
          "fps=12,scale=480:-1:flags=lanczos",
          "-loop",
          "0",
          outPath,
        ],
      };
    case "image-webp":
      return {
        ok: true,
        args: [...common, "-frames:v", "1", "-c:v", "libwebp", "-q:v", "80", outPath],
      };
    case "image-png":
      return {
        ok: true,
        args: [...common, "-frames:v", "1", "-c:v", "png", outPath],
      };
    default:
      return { ok: false, error: `Unhandled preset: ${preset.id}` };
  }
}

export function outputFilenameForPreset(
  inputBasename: string,
  presetId: string,
): string | null {
  const preset = getConverterPreset(presetId);
  if (!preset) return null;
  const base = inputBasename.replace(/\.[^.]+$/, "") || "converted";
  const safe = base.replace(/[^\w.\-]+/g, "_").slice(0, 80) || "converted";
  return `${safe}.${preset.ext}`;
}
