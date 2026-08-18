/**
 * Resolve a login/interactive shell binary that actually exists.
 * macOS often has zsh; Debian slim Hosts have bash/sh only — never assume zsh.
 */

export const UNIX_TERMINAL_SHELL_CANDIDATES = [
  "/bin/bash",
  "/usr/bin/bash",
  "/bin/sh",
  "/usr/bin/sh",
  "/bin/zsh",
  "/usr/bin/zsh",
] as const;

export type ResolveTerminalShellBinInput = {
  platform?: string;
  /** Prefer `process.env.SHELL` / `COMSPEC` when present on disk. */
  envShell?: string | null;
  exists: (absolutePath: string) => boolean;
  /** Override unix probe order (tests). */
  unixCandidates?: readonly string[];
};

/**
 * Pick an existing shell path. Prefer env when it exists; else first candidate
 * that exists. Last resort returns env or a platform default (spawn may still fail).
 */
export function resolveTerminalShellBin(
  input: ResolveTerminalShellBinInput,
): string {
  const platform = input.platform ?? "linux";
  if (platform === "win32") {
    const env = String(input.envShell ?? "").trim();
    return env || "powershell.exe";
  }

  const env = String(input.envShell ?? "").trim();
  if (env && input.exists(env)) return env;

  const candidates = input.unixCandidates ?? UNIX_TERMINAL_SHELL_CANDIDATES;
  for (const path of candidates) {
    if (input.exists(path)) return path;
  }

  return env || "/bin/bash";
}
