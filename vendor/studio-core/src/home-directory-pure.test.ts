import { describe, expect, it } from "vitest";
import {
  HOME_DIRECTORY_NAV,
  buildHomeDirectoryRows,
  homeKindLabel,
  homeStatusLabel,
  queryHomeDirectory,
} from "./home-directory-pure.js";
import { PROJECT_HOME_SECTIONS } from "./project-home-pure.js";

describe("buildHomeDirectoryRows", () => {
  it("builds workspaces, activity, and filtered apps", () => {
    const rows = buildHomeDirectoryRows({
      projects: [
        { id: "demo-blog", name: "Demo Blog", mode: "native" },
        { id: "www-beehiiv", name: "beehiiv.com", mode: "mapped" },
      ],
      activity: [
        {
          id: "c1",
          kind: "chat",
          title: "New chat",
          projectId: "demo-blog",
          at: 200,
        },
        {
          id: "e1",
          kind: "event",
          title: "Standup",
          projectId: null,
          at: 100,
        },
      ],
      sections: PROJECT_HOME_SECTIONS,
      activeProjectId: "demo-blog",
    });

    expect(rows.filter((r) => r.kind === "project")).toHaveLength(2);
    expect(rows.filter((r) => r.kind === "activity")).toHaveLength(2);
    expect(rows.some((r) => r.id === "folder:identity")).toBe(false);
    expect(rows.some((r) => r.id === "folder:settings")).toBe(false);
    expect(rows.some((r) => r.id === "folder:workflows")).toBe(true);
    expect(rows[0]?.kind).toBe("project");
    expect(rows.find((r) => r.kind === "activity")?.title).toBe("New chat");
  });
});

describe("queryHomeDirectory", () => {
  const rows = buildHomeDirectoryRows({
    projects: [{ id: "a", name: "Alpha", mode: "native" }],
    activity: [
      {
        id: "c1",
        kind: "chat",
        title: "Hello world",
        projectId: "a",
        at: 1,
      },
    ],
    sections: PROJECT_HOME_SECTIONS.filter((s) => s.id === "workflows"),
    activeProjectId: "a",
  });

  it("filters by workspaces category", () => {
    const page = queryHomeDirectory({
      rows,
      category: "workspaces",
      search: "",
      page: 1,
    });
    expect(page.items.every((r) => r.kind === "project")).toBe(true);
    expect(page.total).toBe(1);
  });

  it("filters apps category (and legacy folders)", () => {
    const page = queryHomeDirectory({
      rows,
      category: "apps",
      search: "",
      page: 1,
    });
    expect(page.items.every((r) => r.kind === "folder")).toBe(true);
    expect(page.total).toBe(1);
    expect(
      queryHomeDirectory({
        rows,
        category: "folders",
        search: "",
        page: 1,
      }).total,
    ).toBe(1);
  });

  it("filters by search", () => {
    const page = queryHomeDirectory({
      rows,
      category: "activity",
      search: "hello",
      page: 1,
    });
    expect(page.total).toBe(1);
    expect(page.items[0]?.title).toBe("Hello world");
  });
});

describe("home labels", () => {
  it("maps kind and status", () => {
    expect(homeKindLabel("project")).toBe("Workspace");
    expect(homeKindLabel("folder")).toBe("App");
    expect(
      homeStatusLabel({
        id: "x",
        kind: "folder",
        subtype: "workflows",
        title: "Workflows",
        subtitle: "",
        workspace: "a",
        status: "stub",
        sortAt: 0,
        ref: {},
      }),
    ).toBe("Soon");
  });

  it("exposes workspaces / activity / apps nav", () => {
    expect(HOME_DIRECTORY_NAV[0]?.items.map((i) => i.id)).toEqual([
      "workspaces",
      "activity",
      "apps",
    ]);
  });
});
