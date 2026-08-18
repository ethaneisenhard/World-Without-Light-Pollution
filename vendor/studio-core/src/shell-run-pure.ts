/**
 * shell.run — validate agent shell command inputs (pure).
 */

export const SHELL_RUN_DEFAULT_TIMEOUT_MS = 30_000;
export const SHELL_RUN_MAX_TIMEOUT_MS = 120_000;
export const SHELL_RUN_MAX_OUTPUT_CHARS = 200_000;

export type ShellRunCwdMode = "project" | "home";

export type ShellRunInput = {
  command: string;
  cwd?: ShellRunCwdMode;
  timeoutMs?: number;
};

export type ParsedShellRun =
  | { ok: true; command: string; cwd: ShellRunCwdMode; timeoutMs: number }
  | { ok: false; error: string };

export function parseShellRunInput(input: unknown): ParsedShellRun {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "shell.run input must be an object" };
  }
  const o = input as Record<string, unknown>;
  if (typeof o.command !== "string" || !o.command.trim()) {
    return { ok: false, error: "command required (non-empty string)" };
  }
  const command = o.command.trim();
  if (command.includes("\0")) {
    return { ok: false, error: "command must not contain null bytes" };
  }
  if (command.length > 8_000) {
    return { ok: false, error: "command too long (max 8000 chars)" };
  }

  let cwd: ShellRunCwdMode = "project";
  if (o.cwd !== undefined) {
    if (o.cwd !== "project" && o.cwd !== "home") {
      return { ok: false, error: 'cwd must be "project" or "home"' };
    }
    cwd = o.cwd;
  }

  let timeoutMs = SHELL_RUN_DEFAULT_TIMEOUT_MS;
  if (o.timeoutMs !== undefined) {
    if (typeof o.timeoutMs !== "number" || !Number.isFinite(o.timeoutMs)) {
      return { ok: false, error: "timeoutMs must be a number" };
    }
    timeoutMs = Math.round(o.timeoutMs);
    if (timeoutMs < 1_000 || timeoutMs > SHELL_RUN_MAX_TIMEOUT_MS) {
      return {
        ok: false,
        error: `timeoutMs must be 1000–${SHELL_RUN_MAX_TIMEOUT_MS}`,
      };
    }
  }

  return { ok: true, command, cwd, timeoutMs };
}

export function truncateShellOutput(
  text: string,
  max = SHELL_RUN_MAX_OUTPUT_CHARS,
): string {
  if (text.length <= max) return text;
  if (max < 80) {
    return `${text.slice(0, Math.max(0, max - 1))}…`;
  }
  const marker = `\n\n…[truncated ${text.length - max} chars]…\n\n`;
  const budget = max - marker.length;
  const head = Math.floor(budget * 0.7);
  const tail = budget - head;
  return `${text.slice(0, head)}${marker}${text.slice(-tail)}`;
}

export function formatShellRunResult(input: {
  command: string;
  cwd: string;
  code: number;
  stdout: string;
  stderr: string;
}): string {
  const out = truncateShellOutput(input.stdout.trimEnd());
  const err = truncateShellOutput(input.stderr.trimEnd());
  const parts = [
    `$ ${input.command}`,
    `(cwd: ${input.cwd}, exit ${input.code})`,
  ];
  if (out) parts.push(out);
  if (err) parts.push(err ? `stderr:\n${err}` : "");
  return parts.filter(Boolean).join("\n");
}
