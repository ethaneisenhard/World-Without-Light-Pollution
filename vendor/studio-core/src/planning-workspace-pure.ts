/**
 * Planning workspace scaffold — notes/roadmap life projects (not ideal-stack apps).
 */

import {
  DEFAULT_CREATE_COMPUTE_PLACEMENT,
  type ComputePlacement,
  withComputePlacement,
} from "./compute-placement-pure.js";
import {
  pickDefaultWorkspaceShellAccent,
  seededWorkspaceDesignJson,
} from "./workspace-shell-accent-pure.js";

export type PlanningWorkspaceCreateInput = {
  name: string;
  slug?: string;
  brief?: string;
  /** ADR 0016 — default hosted on create. */
  placement?: ComputePlacement;
};

export type PlanningWorkspaceFile = {
  relativePath: string;
  content: string;
};

/** Stable project id / folder slug from a display name. */
export function slugifyPlanningWorkspaceName(raw: string): string {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return s || "workspace";
}

export function resolvePlanningWorkspaceSlug(
  input: PlanningWorkspaceCreateInput,
): string {
  const fromSlug = input.slug?.trim()
    ? slugifyPlanningWorkspaceName(input.slug)
    : "";
  return fromSlug || slugifyPlanningWorkspaceName(input.name);
}

export function planningWorkspacesHome(studioHome: string): string {
  return `${studioHome.replace(/\/+$/, "")}/workspaces`;
}

export function buildPlanningProjectJson(input: {
  id: string;
  name: string;
  placement?: ComputePlacement;
}): Record<string, unknown> {
  return withComputePlacement(
    {
      id: input.id,
      name: input.name,
      kind: "planning",
      mode: "mapped",
      nav: {
        notes: { path: ".glassbox-studio/notes", kind: "files" },
        roadmap: { path: ".glassbox-studio/roadmap", kind: "files" },
      },
    },
    input.placement ?? DEFAULT_CREATE_COMPUTE_PLACEMENT,
  );
}

export function buildPlanningWorkspaceFiles(input: {
  id: string;
  name: string;
  brief?: string;
  placement?: ComputePlacement;
  /** Hex accents already used — skip when picking default shell. */
  takenAccentHexes?: readonly string[];
}): PlanningWorkspaceFile[] {
  const brief = input.brief?.trim() || `Planning workspace for ${input.name}.`;
  const projectJson = `${JSON.stringify(
    buildPlanningProjectJson({
      id: input.id,
      name: input.name,
      placement: input.placement,
    }),
    null,
    2,
  )}\n`;
  const shellAccent = pickDefaultWorkspaceShellAccent({
    projectId: input.id,
    takenAccentHexes: input.takenAccentHexes,
  });
  return [
    {
      relativePath: ".glassbox-studio/project.json",
      content: projectJson,
    },
    {
      relativePath: ".glassbox-studio/design.json",
      content: seededWorkspaceDesignJson(shellAccent),
    },
    {
      relativePath: "README.md",
      content: `# ${input.name}\n\n${brief}\n\n## How to use\n\n- Notes → \`.glassbox-studio/notes/\`\n- Roadmap / checklist → \`.glassbox-studio/roadmap/\`\n- Decisions → \`.glassbox-studio/notes/decisions.md\`\n`,
    },
    {
      relativePath: ".glassbox-studio/notes/decisions.md",
      content: `# Decisions — ${input.name}\n\nTrack material choices here.\n\n| Date | Decision | Why |\n| --- | --- | --- |\n| | | |\n`,
    },
    {
      relativePath: ".glassbox-studio/notes/research.md",
      content: `# Research — ${input.name}\n\nLinks, quotes, and references.\n`,
    },
    {
      relativePath: ".glassbox-studio/roadmap/checklist.md",
      content: `# Roadmap — ${input.name}\n\n- [ ] Clarify goals\n- [ ] Gather constraints (budget, space, timeline)\n- [ ] Shortlist options\n- [ ] Decide and execute\n`,
    },
  ];
}

export function parsePlanningWorkspaceCreateInput(
  input: Record<string, unknown>,
):
  | { ok: true; value: PlanningWorkspaceCreateInput }
  | { ok: false; error: string } {
  const name =
    typeof input.name === "string" ? input.name.trim() : "";
  if (!name) return { ok: false, error: "name is required" };
  const slug =
    typeof input.slug === "string" && input.slug.trim()
      ? input.slug.trim()
      : undefined;
  const brief =
    typeof input.brief === "string" && input.brief.trim()
      ? input.brief.trim()
      : undefined;
  const placementRaw =
    typeof input.placement === "string"
      ? input.placement.trim()
      : typeof (input.compute as { placement?: unknown } | undefined)
            ?.placement === "string"
        ? String(
            (input.compute as { placement: string }).placement,
          ).trim()
        : "";
  const placement =
    placementRaw === "hosted" ||
    placementRaw === "local" ||
    placementRaw === "byo"
      ? placementRaw
      : undefined;
  return { ok: true, value: { name, slug, brief, placement } };
}
