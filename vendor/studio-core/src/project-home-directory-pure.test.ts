import { describe, expect, it } from "vitest";
import {
  PROJECT_HOME_DIRECTORY_NAV,
  buildProjectHomeDirectoryRows,
  projectHomeDirectoryActionLabel,
  queryProjectHomeDirectory,
} from "./project-home-directory-pure.js";
import { PROJECT_HOME_SECTIONS } from "./project-home-pure.js";

describe("buildProjectHomeDirectoryRows", () => {
  it("builds overview, chats, and apps", () => {
    const rows = buildProjectHomeDirectoryRows({
      identity: {
        projectId: "demo-blog",
        displayName: "Demo Blog",
        initials: "DB",
      },
      overview: {
        mode: "native",
        runStatus: "running",
        liveUrl: "http://127.0.0.1:8788",
        prodUrl: undefined,
      },
      chats: [{ id: "c1", title: "Hello", updatedAt: 10 }],
      sections: PROJECT_HOME_SECTIONS,
      runStatusLabel: (s) => (s === "running" ? "Running" : s),
    });

    expect(rows.some((r) => r.id === "overview:identity")).toBe(true);
    expect(rows.some((r) => r.id === "overview:run")).toBe(true);
    expect(rows.filter((r) => r.kind === "chat")).toHaveLength(1);
    expect(rows.some((r) => r.id === "folder:identity")).toBe(false);
    expect(rows.some((r) => r.id === "folder:workflows")).toBe(true);
    expect(
      rows.find((r) => r.id === "folder:workflows")?.typeLabel,
    ).toBe("App");
    expect(rows[0]?.kind).toBe("overview");
  });
});

describe("queryProjectHomeDirectory", () => {
  const rows = buildProjectHomeDirectoryRows({
    identity: {
      projectId: "a",
      displayName: "Alpha",
      initials: "A",
    },
    overview: { runStatus: "off" },
    chats: [{ id: "c1", title: "Keep me", updatedAt: 1 }],
    sections: PROJECT_HOME_SECTIONS.filter((s) => s.id === "media"),
    runStatusLabel: (s) => s,
  });

  it("filters by category", () => {
    const page = queryProjectHomeDirectory({
      rows,
      category: "chats",
      search: "",
      page: 1,
    });
    expect(page.items.every((r) => r.kind === "chat")).toBe(true);
  });

  it("filters apps category (and legacy folders)", () => {
    const page = queryProjectHomeDirectory({
      rows,
      category: "apps",
      search: "",
      page: 1,
    });
    expect(page.items.every((r) => r.kind === "folder")).toBe(true);
    expect(page.total).toBe(1);
    const legacy = queryProjectHomeDirectory({
      rows,
      category: "folders",
      search: "",
      page: 1,
    });
    expect(legacy.total).toBe(1);
  });

  it("filters by search", () => {
    const page = queryProjectHomeDirectory({
      rows,
      category: "all",
      search: "keep",
      page: 1,
    });
    expect(page.total).toBe(1);
    expect(page.items[0]?.title).toBe("Keep me");
  });
});

describe("labels + nav", () => {
  it("maps actions and nav", () => {
    expect(
      projectHomeDirectoryActionLabel({
        id: "c",
        kind: "chat",
        subtype: "chat",
        title: "x",
        subtitle: "",
        typeLabel: "Chat",
        status: "ready",
        sortAt: 0,
        ref: { chatId: "c" },
      }),
    ).toBe("Chat");
    expect(PROJECT_HOME_DIRECTORY_NAV[0]?.items.map((i) => i.id)).toEqual([
      "all",
      "overview",
      "chats",
      "apps",
    ]);
    expect(PROJECT_HOME_DIRECTORY_NAV[0]?.items.map((i) => i.label)).toEqual([
      "All",
      "Overview",
      "Chats",
      "Apps",
    ]);
  });
});

describe("project home identity icon", () => {
  it("shows emoji in the identity subtitle and Set icon action", () => {
    const rows = buildProjectHomeDirectoryRows({
      identity: {
        projectId: "invention-world",
        displayName: "Invention World",
        initials: "IW",
        emoji: "🦊",
      },
      overview: { runStatus: "off" },
      chats: [],
      sections: [],
      runStatusLabel: (s) => s,
    });
    const identity = rows.find((r) => r.id === "overview:identity");
    expect(identity?.subtitle).toBe("invention-world · 🦊");
    expect(projectHomeDirectoryActionLabel(identity!)).toBe("Set icon");
  });
});
