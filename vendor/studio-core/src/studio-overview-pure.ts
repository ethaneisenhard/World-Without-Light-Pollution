/**
 * Home DeskPane — project cards, activity, health projection.
 */

import type { ComputePlacement } from "./compute-placement-pure.js";

export type OverviewProjectCard = {
  id: string;
  name: string;
  mode?: string;
  /** ADR 0016 — where project files / runtimes live. */
  computePlacement?: ComputePlacement;
};

export type OverviewActivityRow = {
  id: string;
  kind: "event" | "chat";
  title: string;
  projectId: string | null;
  at: number;
};

export type OverviewHealth = {
  apiOk: boolean;
  anthropicKeyPresent: boolean;
  mcpHttpOk: boolean;
};

export type StudioOverviewModel = {
  projects: OverviewProjectCard[];
  activity: OverviewActivityRow[];
  health: OverviewHealth;
};

export type OverviewEventInput = {
  id: string;
  title: string;
  projectId: string | null;
  startsAt: number;
};

export type OverviewChatInput = {
  id: string;
  title: string;
  projectId: string | null;
  updatedAt: number;
};

/** Sort upcoming events + recent chats into one activity feed (newest first). */
export function buildOverviewActivity(
  events: readonly OverviewEventInput[],
  chats: readonly OverviewChatInput[],
  now = Date.now(),
  limit = 12,
): OverviewActivityRow[] {
  const upcoming = events
    .filter((e) => e.startsAt >= now - 86_400_000)
    .map(
      (e): OverviewActivityRow => ({
        id: e.id,
        kind: "event",
        title: e.title,
        projectId: e.projectId,
        at: e.startsAt,
      }),
    );
  const chatRows = chats.map(
    (c): OverviewActivityRow => ({
      id: c.id,
      kind: "chat",
      title: c.title || "Chat",
      projectId: c.projectId,
      at: c.updatedAt,
    }),
  );
  return [...upcoming, ...chatRows]
    .sort((a, b) => b.at - a.at)
    .slice(0, limit);
}

export function buildStudioOverview(input: {
  projects: readonly OverviewProjectCard[];
  events: readonly OverviewEventInput[];
  chats: readonly OverviewChatInput[];
  health: OverviewHealth;
  now?: number;
}): StudioOverviewModel {
  return {
    projects: [...input.projects].sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
    activity: buildOverviewActivity(
      input.events,
      input.chats,
      input.now,
    ),
    health: input.health,
  };
}

export function healthChipLabel(health: OverviewHealth): string {
  const parts: string[] = [];
  parts.push(health.apiOk ? "API" : "API down");
  parts.push(health.anthropicKeyPresent ? "Anthropic" : "No API key");
  parts.push(health.mcpHttpOk ? "MCP" : "MCP down");
  return parts.join(" · ");
}
