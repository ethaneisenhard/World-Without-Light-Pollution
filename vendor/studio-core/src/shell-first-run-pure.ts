/**
 * Hosted shell first-run onboarding steps (connect apps).
 * Persist completion in studio config / local preference — not URL SoT.
 */

export type ShellFirstRunStepId =
  | "welcome"
  | "workspace"
  | "messages"
  | "calendar"
  | "media"
  | "automations"
  | "done";

export type ShellFirstRunStep = {
  id: ShellFirstRunStepId;
  title: string;
  body: string;
  /** Canvas kind or settings section to open (optional). */
  open?: { kind?: string; ssect?: string };
  skippable: boolean;
};

export const SHELL_FIRST_RUN_STEPS: readonly ShellFirstRunStep[] = [
  {
    id: "welcome",
    title: "This Host is yours",
    body: "Shells attach to one Host (source of truth). Laptop and Cloud can share it — they don’t sync two brains.",
    skippable: true,
  },
  {
    id: "workspace",
    title: "Studio Starter is ready",
    body: "Your default workspace is Studio Starter — not a copy of someone else’s dogfood repos.",
    open: { kind: "home" },
    skippable: true,
  },
  {
    id: "messages",
    title: "Connect Messages",
    body: "Link chat / messaging so the shell can reach your people.",
    open: { kind: "messages" },
    skippable: true,
  },
  {
    id: "calendar",
    title: "Connect Calendar",
    body: "Bring events into the Calendar window when you’re ready.",
    open: { kind: "calendar" },
    skippable: true,
  },
  {
    id: "media",
    title: "Connect Media",
    body: "Optional — media library for assets and uploads.",
    open: { kind: "media" },
    skippable: true,
  },
  {
    id: "automations",
    title: "Automations (n8n)",
    body: "If your pack includes n8n, open Workflows to finish setup.",
    open: { kind: "workflows" },
    skippable: true,
  },
  {
    id: "done",
    title: "You’re set",
    body: "Re-open tips anytime from Settings. Welcome home.",
    skippable: false,
  },
] as const;

export function nextShellFirstRunStep(
  completedIds: readonly string[],
): ShellFirstRunStep | null {
  const done = new Set(completedIds);
  for (const step of SHELL_FIRST_RUN_STEPS) {
    if (step.id === "done") continue;
    if (!done.has(step.id)) return step;
  }
  return null;
}

export function shellFirstRunShouldShow(input: {
  completedIds: readonly string[];
  dismissed: boolean;
}): boolean {
  if (input.dismissed) return false;
  return nextShellFirstRunStep(input.completedIds) !== null;
}
