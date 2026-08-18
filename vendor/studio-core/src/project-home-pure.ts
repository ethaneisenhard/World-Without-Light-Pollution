/**
 * Project Home DeskPane — per-workspace overview surface.
 * Agent Home (studio-overview) stays global; this is project-scoped.
 */

import {
  WORKSPACE_CHAT_RAIL_PAGE,
  workspaceChatRail,
  type ChatSession,
} from "./chat-session-pure.js";
import type { ProjectRunStatus } from "./project-runtime-pure.js";

export type ProjectHomeSectionStatus = "ready" | "stub" | "link";

export type ProjectHomeSectionId =
  | "identity"
  | "overview"
  | "chats"
  | "theme"
  | "settings"
  | "hosting"
  | "data"
  | "forms"
  | "integrations"
  | "workflows"
  | "email"
  | "analytics"
  | "notes"
  | "roadmap"
  | "memory"
  | "media"
  | "calendar";

export type ProjectHomeSectionDef = {
  id: ProjectHomeSectionId;
  title: string;
  subtitle: string;
  status: ProjectHomeSectionStatus;
  /** Canvas / panel kind to open when status is link (or ready deep-link). */
  openKind?: string;
  /** Settings subsection when openKind is settings. */
  settingsSection?: string;
};

/** Full Project Home surface — ready sections wire now; stubs mark future work. */
export const PROJECT_HOME_SECTIONS: readonly ProjectHomeSectionDef[] = [
  {
    id: "identity",
    title: "Identity",
    subtitle: "Name, icon, accent",
    status: "ready",
  },
  {
    id: "overview",
    title: "Overview",
    subtitle: "Mode, run status, live URL",
    status: "ready",
  },
  {
    id: "chats",
    title: "Recent chats",
    subtitle: "Latest threads in this workspace",
    status: "ready",
  },
  {
    id: "theme",
    title: "Theme & design",
    subtitle: "Project design system / Design canvas",
    status: "link",
    openKind: "design",
  },
  {
    id: "settings",
    title: "Agent settings",
    subtitle: "AI, MCP, rules, providers",
    status: "link",
    openKind: "settings",
    settingsSection: "general",
  },
  {
    id: "hosting",
    title: "Hosting & deploy",
    subtitle: "Prod URL, deploy status",
    status: "stub",
  },
  {
    id: "data",
    title: "Data",
    subtitle: "Sources + destinations",
    status: "link",
    openKind: "data",
  },
  {
    id: "forms",
    title: "Forms",
    subtitle: "Form inbox",
    status: "link",
    openKind: "forms",
  },
  {
    id: "integrations",
    title: "Integrations",
    subtitle: "Connected services",
    status: "link",
    openKind: "integrations",
  },
  {
    id: "workflows",
    title: "Workflows",
    subtitle: "Automation triggers",
    status: "link",
    openKind: "workflows",
  },
  {
    id: "email",
    title: "Email",
    subtitle: "Campaigns + deliverability",
    status: "link",
    openKind: "email",
  },
  {
    id: "analytics",
    title: "Analytics",
    subtitle: "Funnels + events",
    status: "link",
    openKind: "analytics",
  },
  {
    id: "media",
    title: "Media",
    subtitle: "Media library",
    status: "link",
    openKind: "media",
  },
  {
    id: "calendar",
    title: "Calendar",
    subtitle: "Ledger events",
    status: "link",
    openKind: "calendar",
  },
] as const;

export const PROJECT_HOME_PLANNING_SECTIONS: readonly ProjectHomeSectionDef[] =
  [
    {
      id: "identity",
      title: "Identity",
      subtitle: "Name, icon, accent",
      status: "ready",
    },
    {
      id: "overview",
      title: "Overview",
      subtitle: "Mode, run status, live URL",
      status: "ready",
    },
    {
      id: "chats",
      title: "Recent chats",
      subtitle: "Latest threads in this workspace",
      status: "ready",
    },
    {
      id: "notes",
      title: "Notes",
      subtitle: "Project markdown vault",
      status: "link",
      openKind: "notes",
    },
    {
      id: "roadmap",
      title: "Roadmap",
      subtitle: "Project kanban",
      status: "link",
      openKind: "roadmap",
    },
    {
      id: "memory",
      title: "Memory",
      subtitle: "Agent beliefs + learn inbox",
      status: "link",
      openKind: "memory",
    },
    {
      id: "settings",
      title: "Agent settings",
      subtitle: "AI, MCP, rules, providers",
      status: "link",
      openKind: "settings",
      settingsSection: "general",
    },
    {
      id: "calendar",
      title: "Calendar",
      subtitle: "Ledger events",
      status: "link",
      openKind: "calendar",
    },
    {
      id: "media",
      title: "Media",
      subtitle: "Media library",
      status: "link",
      openKind: "media",
    },
  ] as const;

export function projectHomeSectionsForKind(
  kind?: string | null,
): readonly ProjectHomeSectionDef[] {
  const normalized = kind?.trim();
  return normalized === "planning"
    ? PROJECT_HOME_PLANNING_SECTIONS
    : PROJECT_HOME_SECTIONS;
}

export type ProjectHomeChatRow = {
  id: string;
  title: string;
  updatedAt: number;
};

export type ProjectHomeIdentity = {
  displayName: string;
  initials: string;
  emoji?: string;
  accent?: string;
  projectId: string;
};

export type ProjectHomeOverview = {
  mode?: string;
  runStatus: ProjectRunStatus;
  liveUrl?: string;
  prodUrl?: string;
};

export type ProjectHomeModel = {
  identity: ProjectHomeIdentity;
  overview: ProjectHomeOverview;
  chats: ProjectHomeChatRow[];
  chatsHasMore: boolean;
  sections: readonly ProjectHomeSectionDef[];
};

export function buildProjectHomeModel(input: {
  projectId: string;
  displayName: string;
  initials: string;
  emoji?: string;
  accent?: string;
  kind?: string | null;
  mode?: string;
  runStatus?: ProjectRunStatus;
  liveUrl?: string;
  prodUrl?: string;
  chatSessions?: readonly ChatSession[];
  chatLimit?: number;
}): ProjectHomeModel {
  const rail = workspaceChatRail(
    input.chatSessions ?? [],
    input.chatLimit ?? WORKSPACE_CHAT_RAIL_PAGE,
  );
  return {
    identity: {
      projectId: input.projectId,
      displayName: input.displayName,
      initials: input.initials,
      ...(input.emoji ? { emoji: input.emoji } : {}),
      accent: input.accent,
    },
    overview: {
      mode: input.mode,
      runStatus: input.runStatus ?? "off",
      liveUrl: input.liveUrl,
      prodUrl: input.prodUrl,
    },
    chats: rail.sessions.map((s) => ({
      id: s.id,
      title: s.title || "Chat",
      updatedAt: s.updatedAt,
    })),
    chatsHasMore: rail.hasMore,
    sections: projectHomeSectionsForKind(input.kind),
  };
}

export function projectHomeSectionBadge(
  status: ProjectHomeSectionStatus,
): string {
  if (status === "ready") return "Live";
  if (status === "link") return "Open";
  return "Soon";
}

export function runStatusLabel(status: ProjectRunStatus): string {
  if (status === "running") return "Running";
  if (status === "starting") return "Starting";
  if (status === "error") return "Error";
  return "Off";
}
