/**
 * Pure helpers for git tool inputs (no spawn).
 */

export function normalizeGitCommitMessage(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim();
}

export function assertGitCommitMessage(message: string): string {
  if (!message) throw new Error("commit message required");
  if (message.includes("\0")) throw new Error("invalid commit message");
  return message;
}

/** Reject pathspecs that escape the repo (absolute / ..). */
export function assertGitPathspec(raw: string): string {
  const p = raw.trim();
  if (!p) throw new Error("empty pathspec");
  if (p.startsWith("/") || /^[A-Za-z]:[\\/]/.test(p)) {
    throw new Error(`absolute pathspec not allowed: ${p}`);
  }
  if (p.split(/[/\\]/).includes("..")) {
    throw new Error(`pathspec escapes project: ${p}`);
  }
  return p;
}

export function normalizeGitRemote(raw: unknown): string {
  if (typeof raw !== "string" || !raw.trim()) return "origin";
  const r = raw.trim();
  if (!/^[A-Za-z0-9._-]+$/.test(r)) {
    throw new Error(`invalid remote name: ${r}`);
  }
  return r;
}

export function normalizeGitBranch(raw: unknown): string | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  const b = raw.trim();
  if (!/^[A-Za-z0-9._/-]+$/.test(b) || b.includes("..")) {
    throw new Error(`invalid branch name: ${b}`);
  }
  return b;
}
