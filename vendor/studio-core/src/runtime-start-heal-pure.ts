/**
 * Runtime Start preflight / heal decisions — prevent opaque pnpm spawn faces.
 * Pure: no fs / spawn. Orchestrator supplies facts + runs heals.
 */

export type RuntimeStartErrorKind =
  | "port_in_use"
  | "missing_manifest"
  | "missing_deps"
  | "spawn"
  | "unknown";

export type RuntimeStartPreflightAction =
  | "ok"
  | "install_deps"
  | "fail_missing_manifest";

export type RuntimeStartPreflightDecision = {
  action: RuntimeStartPreflightAction;
  /** Plain reason for logs / CTA detail. */
  reason: string;
};

/** Detect known install / manifest failures from spawn logs. */
export function classifyRuntimeStartError(
  input:
    | { lastError?: string | null; log?: readonly string[] | null }
    | null
    | undefined,
): RuntimeStartErrorKind {
  const chunks: string[] = [];
  if (input?.lastError) chunks.push(input.lastError);
  if (input?.log) chunks.push(...input.log);
  const blob = chunks.join("\n").toLowerCase();
  if (
    blob.includes("eaddrinuse") ||
    blob.includes("address already in use") ||
    /\bport\b.*\bin use\b/.test(blob) ||
    blob.includes("another next dev server is already running")
  ) {
    return "port_in_use";
  }
  if (
    blob.includes("err_pnpm_no_importer_manifest") ||
    blob.includes("no package.json") ||
    blob.includes("could not find package.json") ||
    (blob.includes("enoent") && blob.includes("package.json"))
  ) {
    return "missing_manifest";
  }
  if (
    blob.includes("err_pnpm_no_matching") ||
    blob.includes("cannot find module") ||
    blob.includes("err_module_not_found") ||
    /\bnode_modules\b/.test(blob) && blob.includes("not found")
  ) {
    return "missing_deps";
  }
  if (blob.includes("spawn") || blob.includes("exited") || blob.includes("error")) {
    return "spawn";
  }
  return "unknown";
}

/**
 * Before spawn: do we have a package.json? Should we install once?
 * Only package managers (pnpm/npm/yarn) require a manifest — bare `node`/`wrangler` may not.
 */
export function decideRuntimeStartPreflight(input: {
  hasPackageJson: boolean;
  hasNodeModules: boolean;
  command: string;
}): RuntimeStartPreflightDecision {
  const cmd = input.command.trim().toLowerCase();
  const isPkgManager =
    cmd === "pnpm" ||
    cmd === "npm" ||
    cmd === "yarn" ||
    cmd.endsWith("/pnpm") ||
    cmd.endsWith("/npm") ||
    cmd.endsWith("/yarn");
  if (!isPkgManager) {
    return { action: "ok", reason: "ready" };
  }
  if (!input.hasPackageJson) {
    return {
      action: "fail_missing_manifest",
      reason:
        "This project folder has no package.json, so Development cannot start. Sync or re-link the project files on the cloud, then try again.",
    };
  }
  if (!input.hasNodeModules) {
    return {
      action: "install_deps",
      reason:
        "Dependencies are not installed yet. Installing once, then starting Development.",
    };
  }
  return { action: "ok", reason: "ready" };
}

/** Plain CTA / detail header for classified start failures. */
export function runtimeStartErrorPlainHeader(
  kind: RuntimeStartErrorKind,
): string | null {
  switch (kind) {
    case "port_in_use":
      return "Port already in use — another process is on this project's preview URL. Retry to attach if it's already serving, or stop that process first.";
    case "missing_manifest":
      return "This project folder has no package.json. Sync or re-link the project on the cloud, then try again.";
    case "missing_deps":
      return "Project dependencies look incomplete. Retry to install and start again, or open Terminal if it keeps failing.";
    case "spawn":
    case "unknown":
      return null;
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}
