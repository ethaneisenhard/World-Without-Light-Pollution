/**
 * Resolve deploy command from project hosting block (pure).
 */

import type { ProjectHosting } from "./types.js";

export type ResolvedDeploy = {
  cwdRel: string;
  command: string;
  args: string[];
  label: string;
};

export function resolveDeployCommand(
  hosting: ProjectHosting | null | undefined,
  targetId?: string | null,
): ResolvedDeploy | { error: string } {
  const deploy = hosting?.deploy;
  if (!deploy) {
    // Sensible Cloudflare default when hosting.provider is cloudflare.
    if (hosting?.provider === "cloudflare" || !hosting?.provider) {
      return {
        cwdRel: "",
        command: "pnpm",
        args: ["exec", "wrangler", "deploy"],
        label: "wrangler deploy",
      };
    }
    return { error: "hosting.deploy not configured in project.json" };
  }

  if (targetId && Array.isArray(deploy.targets)) {
    const t = deploy.targets.find((x) => x.id === targetId);
    if (!t) return { error: `deploy target not found: ${targetId}` };
    const command = t.command?.trim() || deploy.command?.trim();
    if (!command) return { error: "deploy command missing for target" };
    const parts = command.split(/\s+/).filter(Boolean);
    return {
      cwdRel: (t.cwd ?? deploy.cwd ?? "").replace(/^\/+/, ""),
      command: parts[0]!,
      args: [...parts.slice(1), ...(t.args ?? [])],
      label: `deploy:${t.id}`,
    };
  }

  const command = deploy.command?.trim();
  if (!command) {
    return { error: "hosting.deploy.command required" };
  }
  const parts = command.split(/\s+/).filter(Boolean);
  return {
    cwdRel: (deploy.cwd ?? "").replace(/^\/+/, ""),
    command: parts[0]!,
    args: [...parts.slice(1), ...(deploy.args ?? [])],
    label: "deploy",
  };
}
