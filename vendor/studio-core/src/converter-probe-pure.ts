/**
 * Parse ffmpeg / ffprobe -version stdout (pure).
 */

export function parseFfmpegVersionLine(stdout: string): string | null {
  const line = (stdout ?? "").split("\n")[0]?.trim() ?? "";
  if (!line) return null;
  // e.g. "ffmpeg version 7.1 Copyright ..."
  const m = line.match(/^(?:ffmpeg|ffprobe)\s+version\s+(\S+)/i);
  return m?.[1] ?? (line.startsWith("ffmpeg") || line.startsWith("ffprobe")
    ? line
    : null);
}

export type ConverterProbeResult = {
  ok: boolean;
  ffmpegPath: string | null;
  ffprobePath: string | null;
  ffmpegVersion: string | null;
  ffprobeVersion: string | null;
  error: string | null;
  /** Short install hint for UI. */
  installHint: string;
};

export function converterInstallHint(): string {
  return "Install FFmpeg (macOS: brew install ffmpeg · Linux: apt install ffmpeg), then restart Studio.";
}

export function buildConverterProbeResult(input: {
  ffmpegPath: string | null;
  ffprobePath: string | null;
  ffmpegVersionStdout?: string | null;
  ffprobeVersionStdout?: string | null;
  resolveError?: string | null;
}): ConverterProbeResult {
  const hint = converterInstallHint();
  if (input.resolveError) {
    return {
      ok: false,
      ffmpegPath: null,
      ffprobePath: null,
      ffmpegVersion: null,
      ffprobeVersion: null,
      error: input.resolveError,
      installHint: hint,
    };
  }
  const ffmpegVersion = input.ffmpegVersionStdout
    ? parseFfmpegVersionLine(input.ffmpegVersionStdout)
    : null;
  const ffprobeVersion = input.ffprobeVersionStdout
    ? parseFfmpegVersionLine(input.ffprobeVersionStdout)
    : null;
  const ok = Boolean(input.ffmpegPath && input.ffprobePath && ffmpegVersion);
  return {
    ok,
    ffmpegPath: input.ffmpegPath,
    ffprobePath: input.ffprobePath,
    ffmpegVersion,
    ffprobeVersion,
    error: ok
      ? null
      : !input.ffmpegPath
        ? "ffmpeg not found on PATH"
        : !input.ffprobePath
          ? "ffprobe not found on PATH"
          : "could not read ffmpeg version",
    installHint: hint,
  };
}
