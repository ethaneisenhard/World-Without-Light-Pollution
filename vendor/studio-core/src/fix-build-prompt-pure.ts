/**
 * Seed prompt for Dev Control Plane → durable "fix the Studio client build" turn.
 */

export type FixBuildPromptInput = {
  stderr?: string | null;
  detail?: string | null;
  source?: string | null;
  touchedPaths?: readonly string[] | null;
};

export function buildFixStudioClientBuildPrompt(
  input: FixBuildPromptInput,
): string {
  const stderr = (input.stderr ?? input.detail ?? "").trim().slice(0, 4000);
  const source = (input.source ?? "dev-control-plane").trim() || "dev-control-plane";
  const paths = (input.touchedPaths ?? [])
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 40);

  const lines = [
    "The Glass Box Studio **client** build failed while dogfooding over Tailnet/mobile.",
    "Please diagnose and fix the Studio chrome/client so `pnpm build:client` (or the esbuild watch) succeeds again.",
    "",
    "Constraints:",
    "- Prefer minimal diffs in `apps/studio/client/**` and related build scripts.",
    "- Do not leave the shell white-screening; verify the client bundle builds.",
    "- After fixing, rebuild / confirm live-reload recovers.",
    "",
    `Reported from: ${source}`,
  ];
  if (paths.length) {
    lines.push("", "Touched paths (if known):", ...paths.map((p) => `- ${p}`));
  }
  if (stderr) {
    lines.push("", "Build error / stderr:", "```", stderr, "```");
  } else {
    lines.push("", "(No stderr snippet was attached — check the latest client build failure.)");
  }
  return lines.join("\n");
}

export function newFixBuildSessionId(now = Date.now()): string {
  return `fix-build-${now.toString(36)}`;
}
