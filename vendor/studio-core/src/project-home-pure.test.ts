import { describe, expect, it } from "vitest";
import { createEmptyChatSession } from "./chat-session-pure.js";
import {
  buildProjectHomeModel,
  PROJECT_HOME_SECTIONS,
  projectHomeSectionsForKind,
  projectHomeSectionBadge,
  runStatusLabel,
} from "./project-home-pure.js";

describe("project-home-pure", () => {
  it("lists full section surface including hosting stub", () => {
    const ids = PROJECT_HOME_SECTIONS.map((s) => s.id);
    expect(ids).toContain("identity");
    expect(ids).toContain("hosting");
    expect(ids).toContain("theme");
    expect(PROJECT_HOME_SECTIONS.find((s) => s.id === "hosting")?.status).toBe(
      "stub",
    );
  });

  it("builds model with identity, overview, chats", () => {
    const chat = {
      ...createEmptyChatSession({ now: 2000, id: "c1" }),
      title: "Ship home",
      messages: [{ role: "user" as const, content: "Ship home" }],
      updatedAt: 2000,
    };
    const model = buildProjectHomeModel({
      projectId: "demo-marketing",
      displayName: "Northline",
      initials: "NL",
      accent: "#0d9488",
      mode: "remix",
      runStatus: "running",
      liveUrl: "http://127.0.0.1:8789",
      prodUrl: "https://northline.example",
      chatSessions: [chat],
    });
    expect(model.identity.displayName).toBe("Northline");
    expect(model.overview.runStatus).toBe("running");
    expect(model.overview.prodUrl).toContain("northline");
    expect(model.chats).toHaveLength(1);
    expect(model.chats[0]!.title).toBe("Ship home");
    expect(model.sections.length).toBe(PROJECT_HOME_SECTIONS.length);
  });

  it("switches planning workspaces to planning sections", () => {
    const planning = projectHomeSectionsForKind("planning");
    const ids = planning.map((section) => section.id);
    expect(ids).toEqual([
      "identity",
      "overview",
      "chats",
      "notes",
      "roadmap",
      "memory",
      "settings",
      "calendar",
      "media",
    ]);
    expect(planning.find((section) => section.id === "notes")?.openKind).toBe(
      "notes",
    );
    expect(planning.find((section) => section.id === "roadmap")?.openKind).toBe(
      "roadmap",
    );
    expect(planning.find((section) => section.id === "memory")?.openKind).toBe(
      "memory",
    );

    const model = buildProjectHomeModel({
      projectId: "planning-workspace",
      displayName: "Planning Workspace",
      initials: "PW",
      kind: "planning",
    });
    expect(model.sections.map((section) => section.id)).toEqual(ids);
  });

  it("labels badges and run status", () => {
    expect(projectHomeSectionBadge("ready")).toBe("Live");
    expect(projectHomeSectionBadge("stub")).toBe("Soon");
    expect(runStatusLabel("running")).toBe("Running");
  });
});
