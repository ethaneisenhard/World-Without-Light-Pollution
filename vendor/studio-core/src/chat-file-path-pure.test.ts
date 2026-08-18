import { describe, expect, it } from "vitest";
import {
  CHAT_OPEN_FILE_ATTR,
  chatFileLinkHtml,
  isChatFilePath,
  parseChatFilePath,
  resolveChatOpenFileNav,
} from "./chat-file-path-pure.js";

describe("parseChatFilePath", () => {
  it("accepts repo-relative source paths", () => {
    expect(parseChatFilePath("apps/studio/client/studio-ui-classes.ts")).toBe(
      "apps/studio/client/studio-ui-classes.ts",
    );
    expect(parseChatFilePath("./packages/studio/studio-core/src/index.ts")).toBe(
      "packages/studio/studio-core/src/index.ts",
    );
    expect(parseChatFilePath("content/pages/home.md")).toBe(
      "content/pages/home.md",
    );
  });

  it("strips line:col and citation prefixes", () => {
    expect(parseChatFilePath("apps/studio/client/foo.ts:932")).toBe(
      "apps/studio/client/foo.ts",
    );
    expect(parseChatFilePath("12:15:apps/studio/client/foo.ts")).toBe(
      "apps/studio/client/foo.ts",
    );
  });

  it("rejects urls, absolutes, and prose noise", () => {
    expect(parseChatFilePath("https://example.com/a.ts")).toBeNull();
    expect(parseChatFilePath("/Users/me/Glass Box Studio/foo.ts")).toBeNull();
    expect(parseChatFilePath("e.g.")).toBeNull();
    expect(parseChatFilePath("react@18.2.0")).toBeNull();
    expect(parseChatFilePath("not a path")).toBeNull();
  });

  it("accepts bare filenames with extensions", () => {
    expect(parseChatFilePath("package.json")).toBe("package.json");
    expect(parseChatFilePath("wrangler.jsonc")).toBe("wrangler.jsonc");
  });
});

describe("resolveChatOpenFileNav", () => {
  it("splits projects/<workspace>/… into projectId + relative path", () => {
    expect(
      resolveChatOpenFileNav(
        "projects/glassbox-studio-template/client/design/components/button.tsx",
      ),
    ).toEqual({
      projectId: "glassbox-studio-template",
      filePath: "client/design/components/button.tsx",
    });
  });

  it("splits @ws/<id>/… the same way", () => {
    expect(
      resolveChatOpenFileNav("@ws/demo-blog/content/pages/home.md"),
    ).toEqual({
      projectId: "demo-blog",
      filePath: "content/pages/home.md",
    });
  });

  it("keeps plain project-relative paths on current workspace", () => {
    expect(resolveChatOpenFileNav("client/design/components/button.tsx")).toEqual(
      {
        projectId: null,
        filePath: "client/design/components/button.tsx",
      },
    );
  });
});

describe("chatFileLinkHtml", () => {
  it("stamps open-file attr", () => {
    const html = chatFileLinkHtml({
      path: "apps/studio/client/studio-ui-classes.ts",
    });
    expect(html).toContain(CHAT_OPEN_FILE_ATTR);
    expect(html).toContain("apps/studio/client/studio-ui-classes.ts");
    expect(html).toContain("<code>");
    expect(html).toContain('class="as-chat-file-link"');
  });

  it("isChatFilePath mirrors parse", () => {
    expect(isChatFilePath("docs/adr/0001.md")).toBe(true);
    expect(isChatFilePath("hello")).toBe(false);
  });
});
