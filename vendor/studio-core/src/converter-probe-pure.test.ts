import { describe, expect, it } from "vitest";
import {
  buildConverterProbeResult,
  converterInstallHint,
  parseFfmpegVersionLine,
} from "./converter-probe-pure.js";

describe("converter-probe-pure", () => {
  it("parses version line", () => {
    expect(
      parseFfmpegVersionLine(
        "ffmpeg version 7.1 Copyright (c) 2000-2024 the FFmpeg developers\n",
      ),
    ).toBe("7.1");
    expect(parseFfmpegVersionLine("")).toBe(null);
  });

  it("ok when both binaries + version", () => {
    const r = buildConverterProbeResult({
      ffmpegPath: "/usr/local/bin/ffmpeg",
      ffprobePath: "/usr/local/bin/ffprobe",
      ffmpegVersionStdout: "ffmpeg version 6.0 Copyright",
      ffprobeVersionStdout: "ffprobe version 6.0 Copyright",
    });
    expect(r.ok).toBe(true);
    expect(r.ffmpegVersion).toBe("6.0");
    expect(r.error).toBe(null);
  });

  it("fails when ffmpeg missing", () => {
    const r = buildConverterProbeResult({
      ffmpegPath: null,
      ffprobePath: "/usr/bin/ffprobe",
    });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/ffmpeg not found/i);
    expect(r.installHint).toBe(converterInstallHint());
  });
});
