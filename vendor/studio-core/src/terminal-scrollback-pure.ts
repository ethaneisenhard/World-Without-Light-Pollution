/**
 * Ring-trim helpers for terminal / runtime log buffers — pure.
 */

/** Shell PTY replay after hard refresh (while API process still up). */
export const TERMINAL_SHELL_SCROLLBACK_BYTES = 512 * 1024;

/** Runtime process log ring — was 500 chunks (dropped early yarn/next output). */
export const RUNTIME_LOG_MAX_CHUNKS = 8_000;

/** Client pre-xterm buffer — was 200 chunks (dropped large replay). */
export const TERMINAL_CLIENT_OUTPUT_MAX_CHUNKS = 2_000;
export const TERMINAL_CLIENT_OUTPUT_MAX_BYTES = 1_024 * 1024;

/** Append and trim a string scrollback to maxBytes (keep the tail). */
export function appendTrimmedScrollback(
  current: string,
  chunk: string,
  maxBytes: number,
): string {
  if (!chunk) return current;
  const next = current + chunk;
  if (next.length <= maxBytes) return next;
  return next.slice(next.length - maxBytes);
}

/** Trim a chunk array by count then by total bytes (drop from the front). */
export function trimChunkBuffer(
  chunks: string[],
  maxChunks: number,
  maxBytes: number,
): string[] {
  let out = chunks.length > maxChunks ? chunks.slice(-maxChunks) : chunks;
  let total = 0;
  for (const c of out) total += c.length;
  if (total <= maxBytes) return out;
  let start = 0;
  while (start < out.length && total > maxBytes) {
    total -= out[start]!.length;
    start += 1;
  }
  return start === 0 ? out : out.slice(start);
}
